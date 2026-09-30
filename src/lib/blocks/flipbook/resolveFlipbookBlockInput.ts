import type { Payload } from 'payload'
import type { W1FlipbookConfig, W1FlipbookInput, W1FlipbookPage, W1FlipbookSpread } from '@werk1/w1-system-flipbook/types'
import { mergeConfig } from '@werk1/w1-system-flipbook/config'
import type { HybridPageResolveContext, NonArticlePageSection } from '@/lib/pages/types'
import { FLIPBOOK_BOOLEAN_CONFIG_KEYS } from './config'
import type { FlipbookSectionOverrides, ResolvedFlipbookBlockData } from './types'

type FlipbookSection = Extract<NonArticlePageSection, { type: 'w1-flipbook-block' }>

type Rec = Record<string, unknown>
const asRec = (value: unknown): Rec | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Rec) : null
const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null)
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)

const SIZE_ORDER = [
  ['sm', 640],
  ['md', 1024],
  ['lg', 1600],
  ['xl', 2400],
] as const

const IMAGE_SIZE_PREFERENCE = ['lg', 'md', 'xl', 'sm'] as const

export function mapFlipbookPage(entry: unknown, index: number): W1FlipbookPage | null {
  const item = asRec(entry)
  const media = asRec(item?.image)
  if (!item || !media) return null

  const sizes = asRec(media.sizes)
  const sizeUrl = (name: string) => str(asRec(sizes?.[name])?.url)
  const imageUrl = IMAGE_SIZE_PREFERENCE.map(sizeUrl).find(Boolean) ?? str(media.url)
  const width = num(item.width)
  const height = num(item.height)
  if (!imageUrl || !width || !height) return null

  const srcSetParts = SIZE_ORDER.flatMap(([name, fallbackWidth]) => {
    const url = sizeUrl(name)
    return url ? [`${url} ${num(asRec(sizes?.[name])?.width) ?? fallbackWidth}w`] : []
  })
  const id = typeof media.id === 'string' || typeof media.id === 'number' ? String(media.id) : `page-${index}`

  return {
    id,
    imageUrl,
    width,
    height,
    alt: str(media.alt) ?? `${index + 1}`,
    label: str(item.label) ?? undefined,
    thumbnailUrl: sizeUrl('thumb') ?? undefined,
    srcSet: srcSetParts.length > 0 ? srcSetParts.join(', ') : undefined,
  }
}

const SPREAD_THUMB_PREFERENCE = ['sm', 'md', 'thumb'] as const
const SPREAD_IMAGE_PREFERENCE = ['lg', 'xl', 'md'] as const

/** Maps `spreads[]` (1-based page numbers in the document) to the package's 0-based spread type. */
export function mapFlipbookSpread(entry: unknown, index: number, pageCount: number): W1FlipbookSpread | null {
  const item = asRec(entry)
  const media = asRec(item?.image)
  if (!item || !media) return null

  const first = num(item.firstPage)
  const last = num(item.lastPage)
  const width = num(item.width)
  const height = num(item.height)
  const coverMode = item.coverMode === 'covers' || item.coverMode === 'none' ? item.coverMode : null
  if (!first || !last || !width || !height || !coverMode) return null
  if (first < 1 || last !== first + 1 || last > pageCount) return null

  const sizes = asRec(media.sizes)
  const sizeUrl = (name: string) => str(asRec(sizes?.[name])?.url)
  const imageUrl = SPREAD_IMAGE_PREFERENCE.map(sizeUrl).find(Boolean) ?? str(media.url)
  if (!imageUrl) return null
  const id = typeof media.id === 'string' || typeof media.id === 'number' ? String(media.id) : `spread-${index}`

  return {
    id,
    pages: [first - 1, last - 1],
    coverMode,
    imageUrl,
    thumbnailUrl: SPREAD_THUMB_PREFERENCE.map(sizeUrl).find(Boolean) ?? undefined,
    width,
    height,
    alt: str(media.alt) ?? `${first}\u2013${last}`,
  }
}

function readDefaultConfig(raw: unknown): W1FlipbookConfig {
  const source = asRec(raw)
  if (!source) return {}
  const config: W1FlipbookConfig = {}
  for (const key of ['spreadMode', 'coverMode', 'direction', 'theme'] as const) {
    const value = str(source[key])
    if (value) (config as Rec)[key] = value
  }
  for (const key of FLIPBOOK_BOOLEAN_CONFIG_KEYS) {
    if (typeof source[key] === 'boolean') config[key] = source[key] as boolean
  }
  const startPage = num(source.startPage)
  if (startPage !== null && startPage >= 1) config.startPage = startPage - 1
  const aspectRatio = str(source.aspectRatio)
  if (aspectRatio) config.aspectRatio = aspectRatio
  const maxWidthPx = num(source.maxWidthPx)
  if (maxWidthPx !== null) config.maxWidthPx = maxWidthPx
  return config
}

const parseTriState = (value: unknown): boolean | undefined =>
  value === true || value === 'true' ? true : value === false || value === 'false' ? false : undefined

export function readSectionOverrides(section: Rec): FlipbookSectionOverrides {
  const overrides: FlipbookSectionOverrides = {}
  for (const key of ['spreadMode', 'coverMode', 'direction', 'theme'] as const) {
    const value = str(section[key])
    if (value) (overrides as Rec)[key] = value
  }
  const startPage = num(section.startPage)
  if (startPage !== null && startPage >= 1) overrides.startPage = startPage - 1
  for (const key of ['showControls', 'showThumbnails'] as const) {
    const value = parseTriState(section[key])
    if (value !== undefined) overrides[key] = value
  }
  const aspectRatio = str(section.aspectRatio)
  if (aspectRatio) overrides.aspectRatio = aspectRatio
  const maxWidthPx = num(section.maxWidthPx)
  if (maxWidthPx !== null) overrides.maxWidthPx = maxWidthPx
  return overrides
}

/**
 * Pure mapping of a `flipbooks` document (depth >= 2) to `W1FlipbookInput`.
 * Merge order: section override > flipbook `defaultConfig` > package default.
 * Returns null when there is no published revision to show.
 */
export function mapFlipbookToInput(
  doc: unknown,
  overrides: FlipbookSectionOverrides = {},
): W1FlipbookInput | null {
  const flipbook = asRec(doc)
  if (!flipbook || flipbook.isPublished !== true) return null

  const pdfUrl = str(asRec(flipbook.publishedSourcePdf)?.url)
  const pages = (Array.isArray(flipbook.pages) ? flipbook.pages : [])
    .map(mapFlipbookPage)
    .filter((page): page is W1FlipbookPage => page !== null)
  const slug = str(flipbook.slug)
  if (!slug || !pdfUrl || pages.length === 0) return null

  const spreads = (Array.isArray(flipbook.spreads) ? flipbook.spreads : [])
    .map((entry, index) => mapFlipbookSpread(entry, index, pages.length))
    .filter((spread): spread is W1FlipbookSpread => spread !== null)

  return {
    slug,
    title: str(flipbook.title) ?? undefined,
    pdfUrl,
    pages,
    ...(spreads.length > 0 ? { spreads } : {}),
    config: mergeConfig({ ...readDefaultConfig(flipbook.defaultConfig), ...overrides }),
  }
}

export type FlipbookMenuItem = { slug: string; title: string }

/**
 * Lightweight list of all published flipbooks for the header menu —
 * slug + localized title only.
 */
export async function listPublishedFlipbooks(
  payload: Payload,
  locale: string,
): Promise<FlipbookMenuItem[]> {
  const result = await payload.find({
    collection: 'flipbooks' as never,
    where: { and: [{ isPublished: { equals: true } }, { publishedRevision: { exists: true } }] } as never,
    sort: ['sortOrder', '-updatedAt'] as never,
    limit: 500,
    depth: 0,
    locale: locale as never,
    overrideAccess: false,
    select: { slug: true, title: true } as never,
  })
  return (result.docs as unknown as Rec[]).flatMap((doc) => {
    const slug = str(doc.slug)
    return slug ? [{ slug, title: str(doc.title) ?? slug }] : []
  })
}

export async function loadPublishedFlipbook(
  payload: Payload,
  slug: string,
  locale: string,
): Promise<unknown | null> {
  const lookup = await payload.find({
    collection: 'flipbooks' as never,
    where: { and: [{ slug: { equals: slug } }, { isPublished: { equals: true } }] } as never,
    depth: 2,
    limit: 1,
    overrideAccess: false,
    locale: locale as never,
  })
  return lookup.docs[0] ?? null
}

export async function resolveFlipbookBlockInput(
  section: FlipbookSection,
  context: HybridPageResolveContext,
): Promise<Record<string, unknown>> {
  const flipbookSlug = section.flipbookSlug ?? null
  const data: ResolvedFlipbookBlockData = { flipbookSlug, locale: context.locale, input: null }
  if (!flipbookSlug) return data

  const doc = await loadPublishedFlipbook(context.payload, flipbookSlug, context.locale)
  data.input = mapFlipbookToInput(doc, withSectionDefaults(readSectionOverrides(section as unknown as Rec)))
  return data
}

/**
 * Embedded sections hide the thumbnail strip unless the section explicitly
 * enables it; the flipbook's `defaultConfig.showThumbnails` applies to the
 * reader route.
 */
export function withSectionDefaults(overrides: FlipbookSectionOverrides): FlipbookSectionOverrides {
  return overrides.showThumbnails === undefined ? { ...overrides, showThumbnails: false } : overrides
}

/** URL of the resolved cover (`coverImage`, populated) for listing and OG image. */
export function coverUrlOf(doc: unknown): string | null {
  const cover = asRec(asRec(doc)?.coverImage)
  if (!cover) return null
  const sizes = asRec(cover.sizes)
  return str(asRec(sizes?.lg)?.url) ?? str(asRec(sizes?.md)?.url) ?? str(cover.url)
}
