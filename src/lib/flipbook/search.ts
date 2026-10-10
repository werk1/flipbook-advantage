import { buildSearchIndex, createTermMatcher, searchIndex } from '@werk1/w1-system-pdfedit/export'
import type { W1FormSearchIndex, W1FormTextBlock, W1FormTextModel, W1PdfEditRecord } from '@werk1/w1-system-pdfedit/types'
import type { Payload } from 'payload'

type Rect = { x: number; y: number; w: number; h: number }

export type FlipbookSearchHit = {
  pageIndex: number
  snippet: string
  /** Block of the hit: where the reader's zoomed view moves to. */
  rect?: Rect
  /** The matched words of the hit: what the reader highlights on the page. */
  marks?: Rect[]
  /** Set for a hit in another issue of the series (see `seriesSearch.ts`). */
  document?: { id: string; title: string; issue?: string; href: string }
}

type Rec = Record<string, unknown>
/** A word to match and the boxes it covers (two for a word hyphenated across lines). */
type Word = { text: string; rects: Rect[] }
type Prepared = { index: W1FormSearchIndex; blocks: Map<string, { rect: Rect; words: Word[] }> }

const MAX_QUERY = 100
const MAX_HITS = 50
const CACHE_SIZE = 24
const cache = new Map<string, Prepared>()

const asRec = (value: unknown): Rec | null => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Rec) : null)

// Page rects go to the reader with four decimals: a tenth of a pixel on a
// page of 1000px, and a far smaller answer.
const round = (value: number) => Math.round(value * 10000) / 10000
const roundRect = (rect: Rect): Rect => ({ x: round(rect.x), y: round(rect.y), w: round(rect.w), h: round(rect.h) })

/** The word blocks of a block, line by line (block → lines → words). */
function linesOf(block: W1FormTextBlock, byId: ReadonlyMap<string, W1FormTextBlock>): W1FormTextBlock[][] {
  const children = (block.childIds ?? []).flatMap((id) => byId.get(id) ?? [])
  if (block.level === 'word') return [[block]]
  if (block.level === 'line') return [children.filter((child) => child.level === 'word')]
  return children.flatMap((child) => linesOf(child, byId))
}

const LINE_END_HYPHEN = /[-­‐]$/

/**
 * Words of a block to match, with their boxes from the text model. A word
 * hyphenated at the end of a line ("Zu-" + "kunft") is matched as one, as the
 * block text and the index have it, and covers both boxes. A block whose text
 * an override replaced keeps no words: its boxes belong to the old text, so
 * the reader highlights the block as a whole.
 */
function wordsOf(block: W1FormTextBlock, byId: ReadonlyMap<string, W1FormTextBlock>, replaced: ReadonlySet<string>): Word[] {
  if (replaced.has(block.id)) return []
  const lines = linesOf(block, byId)
  const words: Word[] = []
  lines.forEach((line, i) => {
    for (const word of line) words.push({ text: word.text, rects: [word.rect] })
    const last = line[line.length - 1]
    const next = lines[i + 1]?.[0]
    if (last && next && LINE_END_HYPHEN.test(last.text)) {
      words.push({ text: last.text.replace(LINE_END_HYPHEN, '') + next.text, rects: [last.rect, next.rect] })
    }
  })
  return words
}

/**
 * Text of the document as the reader shows it: the converted text model, with
 * the texts of edited record blocks swapped in for pages whose PDF was
 * updated (an edit that is not in the PDF yet must not be findable).
 */
function modelForReader(model: W1FormTextModel, records: readonly W1PdfEditRecord[], editedPages: ReadonlySet<number>): W1FormTextModel {
  const edits = new Map<string, string>()
  for (const record of records) {
    for (const block of record.blocks) if (block.edited && block.text.trim()) edits.set(block.blockId, block.text)
  }
  if (edits.size === 0 || editedPages.size === 0) return model
  return {
    ...model,
    pages: model.pages.map((page) =>
      editedPages.has(page.pageIndex)
        ? { ...page, blocks: page.blocks.map((b) => (edits.has(b.id) ? { ...b, text: edits.get(b.id) as string } : b)) }
        : page,
    ),
  }
}

/** Version of a flipbook's searchable text: it changes with a new revision or with active overrides. */
export function indexKeyOf(flipbook: Rec): string {
  const overridesActive = typeof flipbook.overrideRevision === 'string' && flipbook.overrideRevision === flipbook.publishedRevision
  return `${String(flipbook.id)}|${String(flipbook.publishedRevision)}|${overridesActive ? String(flipbook.updatedAt) : '-'}`
}

/**
 * The text of a flipbook as the reader shows it (converted text model with
 * the text of edited blocks swapped in), and the converted model it started
 * from. Null when the flipbook has no text model.
 */
export async function readerModelOf(payload: Payload, flipbook: Rec): Promise<{ source: W1FormTextModel; model: W1FormTextModel } | null> {
  const overridesActive = typeof flipbook.overrideRevision === 'string' && flipbook.overrideRevision === flipbook.publishedRevision
  // The text model (often > 1 MB) is only read when the index is built.
  const full = asRec(
    await payload
      .findByID({
        collection: 'flipbooks' as never,
        id: flipbook.id as string | number,
        depth: 0,
        overrideAccess: true,
        select: { textModel: true, pageOverrides: true } as never,
      })
      .catch(() => null),
  )
  const model = full?.textModel as W1FormTextModel | null | undefined
  if (!model || !Array.isArray(model.pages)) return null

  let source = model
  if (overridesActive) {
    const editedPages = new Set<number>(
      (Array.isArray(full?.pageOverrides) ? full.pageOverrides : []).flatMap((row) => {
        const index = asRec(row)?.pageIndex
        return typeof index === 'number' ? [index] : []
      }),
    )
    // Hosts without the pdfedit module have no `pdfedits` collection: no edits then.
    try {
      const pdfedits = await payload.find({
        collection: 'pdfedits' as never,
        where: { flipbook: { equals: flipbook.id } } as never,
        depth: 0,
        limit: 20,
        pagination: false,
        overrideAccess: true,
      })
      const ids = (pdfedits.docs as unknown as Rec[]).map((d) => d.id)
      if (ids.length > 0 && editedPages.size > 0) {
        const { docs } = await payload.find({
          collection: 'pdfeditrecords' as never,
          where: { pdfedit: { in: ids } } as never,
          depth: 0,
          pagination: false,
          overrideAccess: true,
        })
        const records = (docs as unknown as Rec[]).map((r) => ({
          id: String(r.id),
          order: 0,
          blocks: Array.isArray(r.blocks) ? (r.blocks as W1PdfEditRecord['blocks']) : [],
        }))
        source = modelForReader(model, records, editedPages)
      }
    } catch {
      source = model
    }
  }
  return { source, model }
}

async function prepare(payload: Payload, flipbook: Rec): Promise<Prepared | null> {
  const key = indexKeyOf(flipbook)
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const loaded = await readerModelOf(payload, flipbook)
  if (!loaded) return null
  const { source, model } = loaded
  // Blocks whose text an override replaced (the reader's text differs from
  // the converted one).
  const replaced = new Set<string>()
  if (source !== model) {
    const original = new Map(model.pages.flatMap((page) => page.blocks.map((b) => [b.id, b.text] as const)))
    for (const page of source.pages) for (const block of page.blocks) if (original.get(block.id) !== block.text) replaced.add(block.id)
  }
  const blocks: Prepared['blocks'] = new Map()
  for (const page of source.pages) {
    const byId = new Map(page.blocks.map((b) => [b.id, b]))
    for (const block of page.blocks) blocks.set(block.id, { rect: block.rect, words: wordsOf(block, byId, replaced) })
  }
  const prepared = { index: buildSearchIndex(source), blocks }
  cache.set(key, prepared)
  while (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string)
  return prepared
}

/**
 * Full-text search in a published flipbook. Only published flipbooks are
 * searchable; the text model itself never leaves the server, only page,
 * snippet, the block rect and the rects of the matched words (found with the
 * index's own rules, `createTermMatcher`).
 * Returns `null` when the flipbook is not found or cannot be searched — also
 * when its `defaultConfig.allowSearch` is off and the viewer is no admin. An
 * empty query returns `[]` for a searchable flipbook (the reader probes with
 * it).
 */
export async function searchPublishedFlipbook(
  payload: Payload,
  slug: string,
  query: string,
  viewer: { admin: boolean } = { admin: false },
): Promise<FlipbookSearchHit[] | null> {
  const found = await payload.find({
    collection: 'flipbooks' as never,
    where: { and: [{ slug: { equals: slug.toLowerCase() } }, { isPublished: { equals: true } }, { publishedRevision: { exists: true } }] } as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    // Only what the index cache key needs; `prepare` loads the text model on a miss.
    select: { publishedRevision: true, overrideRevision: true, updatedAt: true, defaultConfig: true } as never,
  })
  const flipbook = asRec(found.docs[0])
  if (!flipbook) return null
  const settings = asRec(flipbook.defaultConfig)
  if (!viewer.admin && settings?.allowSearch === false) return null
  const prepared = await prepare(payload, flipbook)
  if (!prepared) return null
  if (!query.trim()) return []
  const text = query.slice(0, MAX_QUERY)
  const matches = createTermMatcher(text)
  return searchIndex(prepared.index, text)
    .slice(0, MAX_HITS)
    .map((hit) => {
      const block = prepared.blocks.get(hit.blockId)
      if (!block) return { pageIndex: hit.pageIndex, snippet: hit.snippet }
      // A box can come twice (a hyphenated part on its own and joined).
      const boxes = new Set(block.words.filter((word) => matches(word.text)).flatMap((word) => word.rects))
      const marks = [...boxes].map(roundRect)
      return { pageIndex: hit.pageIndex, snippet: hit.snippet, rect: roundRect(block.rect), ...(marks.length > 0 ? { marks } : {}) }
    })
}
