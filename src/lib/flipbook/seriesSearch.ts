import { buildSearchIndex, normalizeTerms, searchIndex } from '@werk1/w1-system-pdfedit/export'
import type { W1FormTextModel } from '@werk1/w1-system-pdfedit/types'
import type { Payload } from 'payload'
import { indexKeyOf, readerModelOf, searchPublishedFlipbook, type FlipbookSearchHit } from './search'

type Rec = Record<string, unknown>

/** Collection of the index rows (one per text block of a published flipbook). */
const BLOCKS = 'flipbook-search-blocks'
const MAX_QUERY = 100
/** Hits shown per other issue and over all other issues. */
const HITS_PER_ISSUE = 8
const MAX_OTHER_HITS = 60
/** Other issues of a series that are searched at once. */
const MAX_ISSUES = 60
/** Issues whose index is built at the same time (the text model is large). */
const BUILD_PARALLELISM = 2
const ROW_BATCH = 500

export type SeriesSearchScope = 'issue' | 'all'

const asRec = (value: unknown): Rec | null => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Rec) : null)
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The index rows are read with the database driver: the `where` of the local
// API cannot express the anchored prefix match on an array element.
type RowModel = {
  find: (filter: Rec, projection?: Rec) => { limit: (n: number) => { lean: () => Promise<Rec[]> } }
  countDocuments: (filter: Rec) => Promise<number>
  deleteMany: (filter: Rec) => Promise<unknown>
  insertMany: (docs: Rec[]) => Promise<unknown>
  createIndexes: () => Promise<unknown>
}

// The indexes come with the collection's first start; a process that began
// before the collection existed asks for them once.
let indexes: Promise<unknown> | null = null
function rowModel(payload: Payload): RowModel | null {
  const model = (payload.db as unknown as { collections?: Record<string, RowModel> }).collections?.[BLOCKS]
  return model ?? null
}

/** The flipbook's `series` as an id (depth 0 gives the id itself). */
function seriesIdOf(flipbook: Rec): string | null {
  const series = flipbook.series
  const id = asRec(series)?.id ?? series
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null
}

async function publishedFlipbooks(payload: Payload, where: Rec, limit: number): Promise<Rec[]> {
  const found = await payload.find({
    collection: 'flipbooks' as never,
    where: { and: [{ isPublished: { equals: true } }, { publishedRevision: { exists: true } }, where] } as never,
    depth: 0,
    limit,
    pagination: false,
    sort: '-createdAt',
    overrideAccess: true,
    select: { title: true, slug: true, issue: true, series: true, publishedRevision: true, overrideRevision: true, updatedAt: true, defaultConfig: true } as never,
  })
  return found.docs as unknown as Rec[]
}

/**
 * The other issues of the flipbook's series that the viewer may search: the
 * published ones whose `defaultConfig.allowSearch` is not off (admins see all).
 */
export async function otherIssuesOf(payload: Payload, flipbook: Rec, viewer: { admin: boolean }): Promise<Rec[]> {
  const series = seriesIdOf(flipbook)
  if (!series) return []
  const issues = await publishedFlipbooks(payload, { and: [{ series: { equals: series } }, { id: { not_equals: flipbook.id } }] }, MAX_ISSUES)
  return issues.filter((issue) => viewer.admin || asRec(issue.defaultConfig)?.allowSearch !== false)
}

/**
 * Makes sure the index rows of `flipbook` match its current searchable text:
 * rows of an older version are dropped, the missing ones are built from the
 * reader's text model. Returns the index key, or null without a text model.
 */
export function ensureIndexed(payload: Payload, flipbook: Rec): Promise<string | null> {
  const key = indexKeyOf(flipbook)
  // Two searches for the same version build its rows once.
  const running = building.get(key)
  if (running) return running
  const build = buildIndex(payload, flipbook, key).finally(() => building.delete(key))
  building.set(key, build)
  return build
}

const building = new Map<string, Promise<string | null>>()

async function buildIndex(payload: Payload, flipbook: Rec, key: string): Promise<string | null> {
  const id = String(flipbook.id)
  const rows = rowModel(payload)
  if (!rows) return null
  indexes ??= rows.createIndexes().catch(() => undefined)
  await indexes
  if ((await rows.countDocuments({ flipbook: id, indexKey: key })) > 0) return key
  const loaded = await readerModelOf(payload, flipbook)
  if (!loaded) return null
  await rows.deleteMany({ flipbook: id })
  const docs = blockRows(loaded.source).map((row) => ({ ...row, flipbook: id, indexKey: key }))
  for (let i = 0; i < docs.length; i += ROW_BATCH) await rows.insertMany(docs.slice(i, i + ROW_BATCH))
  return key
}

/** The rows of a text model: block-level blocks (all levels when a page has none), like the document index. */
export function blockRows(model: W1FormTextModel): Array<{ pageIndex: number; blockId: string; text: string; terms: string[] }> {
  const rows: Array<{ pageIndex: number; blockId: string; text: string; terms: string[] }> = []
  for (const page of model.pages) {
    const hasBlocks = page.blocks.some((b) => b.level === 'block')
    for (const block of page.blocks) {
      if ((hasBlocks && block.level !== 'block') || !block.text) continue
      rows.push({ pageIndex: block.pageIndex, blockId: block.id, text: block.text, terms: [...new Set(normalizeTerms(block.text))] })
    }
  }
  return rows
}

/**
 * Rows of `keys` (flipbook id → index key) that match the query by the
 * document index's rules: every term is a term of the block, the last one may
 * be its prefix.
 */
async function matchingRows(payload: Payload, keys: ReadonlyMap<string, string>, queryTerms: string[]): Promise<Rec[]> {
  const rows = rowModel(payload)
  if (!rows || keys.size === 0 || queryTerms.length === 0) return []
  const last = queryTerms[queryTerms.length - 1]
  const filter = {
    $or: [...keys].map(([flipbook, indexKey]) => ({ flipbook, indexKey })),
    $and: [...queryTerms.slice(0, -1).map((term) => ({ terms: term })), { terms: { $regex: `^${escapeRegex(last)}` } }],
  }
  return rows.find(filter, { _id: 0, flipbook: 1, pageIndex: 1, blockId: 1, text: 1 }).limit(ROW_BATCH).lean()
}

/** Hits of the other issues, found in the persisted index; page and snippet only. */
async function searchOtherIssues(payload: Payload, issues: Rec[], query: string): Promise<FlipbookSearchHit[]> {
  const queryTerms = normalizeTerms(query)
  if (queryTerms.length === 0 || issues.length === 0) return []

  const keys = new Map<string, string>()
  for (let i = 0; i < issues.length; i += BUILD_PARALLELISM) {
    await Promise.all(
      issues.slice(i, i + BUILD_PARALLELISM).map(async (issue) => {
        const key = await ensureIndexed(payload, issue).catch(() => null)
        if (key) keys.set(String(issue.id), key)
      }),
    )
  }
  const rows = await matchingRows(payload, keys, queryTerms)

  // The snippets come from the document index itself, built from the matching
  // blocks only: same text, same order, same rules.
  const hits: FlipbookSearchHit[] = []
  for (const issue of issues) {
    const own = rows.filter((row) => row.flipbook === String(issue.id))
    if (own.length === 0) continue
    const model = {
      revision: '',
      pages: [...new Set(own.map((row) => row.pageIndex as number))].map((pageIndex) => ({
        pageIndex,
        blocks: own.filter((row) => row.pageIndex === pageIndex).map((row) => ({ id: row.blockId, pageIndex, level: 'block', text: row.text })),
      })),
    } as unknown as W1FormTextModel
    const slug = String(issue.slug)
    const document = { id: slug, title: String(issue.title ?? slug), ...(typeof issue.issue === 'string' && issue.issue ? { issue: issue.issue } : {}) }
    for (const hit of searchIndex(buildSearchIndex(model), query).slice(0, HITS_PER_ISSUE)) {
      const href = `/flipbooks/${encodeURIComponent(slug)}?page=${hit.pageIndex + 1}&q=${encodeURIComponent(query)}`
      hits.push({ pageIndex: hit.pageIndex, snippet: hit.snippet, document: { ...document, href } })
    }
  }
  return hits.slice(0, MAX_OTHER_HITS)
}

/** Whether the search of `slug` can reach other issues (the reader then offers the switch). */
export async function searchScopesOf(payload: Payload, slug: string, viewer: { admin: boolean }): Promise<SeriesSearchScope[]> {
  const flipbook = await findBySlug(payload, slug)
  if (!flipbook) return ['issue']
  return (await otherIssuesOf(payload, flipbook, viewer)).length > 0 ? ['issue', 'all'] : ['issue']
}

async function findBySlug(payload: Payload, slug: string): Promise<Rec | null> {
  const [flipbook] = await publishedFlipbooks(payload, { slug: { equals: slug.toLowerCase() } }, 1)
  return flipbook ?? null
}

/**
 * Search in a published flipbook (`scope` `issue`) or in it and the other
 * issues of its series (`all`): the hits of this issue come first, with
 * marks, then those of the others, each carrying its `document`. Null when
 * the flipbook is not found or cannot be searched, like
 * `searchPublishedFlipbook`.
 */
export async function searchSeries(
  payload: Payload,
  slug: string,
  query: string,
  scope: SeriesSearchScope,
  viewer: { admin: boolean } = { admin: false },
): Promise<FlipbookSearchHit[] | null> {
  const own = await searchPublishedFlipbook(payload, slug, query, viewer)
  if (own === null || scope !== 'all' || !query.trim()) return own
  const flipbook = await findBySlug(payload, slug)
  if (!flipbook) return own
  const issues = await otherIssuesOf(payload, flipbook, viewer)
  return [...own, ...(await searchOtherIssues(payload, issues, query.slice(0, MAX_QUERY)))]
}
