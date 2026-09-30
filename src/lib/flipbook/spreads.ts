import sharp from 'sharp'

/**
 * Double-page ("spread") images for the flipbook thumbnail strip.
 *
 * The viewer pairs pages by `coverMode`, which is only known at display time
 * (block override > flipbook default). Both pairings are therefore rendered:
 *
 * - `covers`: 2-3, 4-5, ... (cover and, for even page counts, the last page stand alone)
 * - `none`:   1-2, 3-4, ... (for odd page counts the last page stands alone)
 *
 * The two sets never share a pair, so a pair of page numbers identifies its
 * image. Lone pages use the single-page thumbnails. Pure logic plus one sharp
 * call, no Payload imports.
 */

export type FlipbookSpreadCoverMode = 'covers' | 'none'

export type SpreadPair = {
  coverMode: FlipbookSpreadCoverMode
  /** 1-based physical page numbers, left then right (LTR). */
  pages: [number, number]
}

export const SPREAD_WIDTH_PX = 2400
export const SPREAD_PAPER_COLOR = '#f7f4ee'

/** Pairs that become complete when `pageNumber` (1-based) has been rendered. */
export function spreadPairsEndingAt(pageNumber: number): SpreadPair[] {
  if (pageNumber < 2) return []
  const pages: [number, number] = [pageNumber - 1, pageNumber]
  return pageNumber % 2 === 0 ? [{ coverMode: 'none', pages }] : [{ coverMode: 'covers', pages }]
}

export function expectedSpreadPairs(pageCount: number): SpreadPair[] {
  const pairs: SpreadPair[] = []
  for (let page = 2; page <= pageCount; page += 1) pairs.push(...spreadPairsEndingAt(page))
  return pairs
}

/** Landscape pages are already (or act as) spreads; no composites for them. */
export const shouldComposeSpreads = (firstPage: { width: number; height: number } | undefined): boolean =>
  Boolean(firstPage && firstPage.width > 0 && firstPage.height > 0 && firstPage.width <= firstPage.height)

export function spreadCellSize(firstPage: { width: number; height: number }): { width: number; height: number } {
  const width = SPREAD_WIDTH_PX / 2
  return { width, height: Math.max(1, Math.round((width * firstPage.height) / firstPage.width)) }
}

export async function composeSpread(options: {
  leftPath: string
  rightPath: string
  outPath: string
  cell: { width: number; height: number }
  paper?: string
}): Promise<{ width: number; height: number }> {
  const paper = options.paper ?? SPREAD_PAPER_COLOR
  const fit = (file: string) =>
    sharp(file).resize(options.cell.width, options.cell.height, { fit: 'contain', background: paper }).flatten({ background: paper }).png().toBuffer()
  const [left, right] = await Promise.all([fit(options.leftPath), fit(options.rightPath)])
  const width = options.cell.width * 2
  await sharp({ create: { width, height: options.cell.height, channels: 3, background: paper } })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: options.cell.width, top: 0 },
    ])
    .png()
    .toFile(options.outPath)
  return { width, height: options.cell.height }
}
