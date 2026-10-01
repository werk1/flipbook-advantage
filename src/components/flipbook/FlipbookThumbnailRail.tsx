'use client'

import { useMemo } from 'react'
import { W1StripRail, type W1CarouselItem } from '@werk1/w1-system-carouselblock/strip'
import type { W1FlipbookPage, W1FlipbookThumbnailItem, W1FlipbookThumbnailStripProps } from '@werk1/w1-system-flipbook'
import { useBoundStore } from '@/stores/boundStore'
import styles from './FlipbookThumbnailRail.module.css'

/** Rail height in px; tile widths follow each tile's ratio (`fitHeight`). */
const THUMB_HEIGHT_PX = 90

const pageThumb = (page: W1FlipbookPage) => page.thumbnailUrl ?? page.imageUrl

function TileContent({ item }: { item: W1FlipbookThumbnailItem }) {
  return (
    <span className={styles.tile}>
      {item.visualPages.map((page) => (
        <span key={page.id} className={styles.cell}>
          <img src={pageThumb(page)} alt="" loading="lazy" decoding="async" />
        </span>
      ))}
    </span>
  )
}

/**
 * App-host adapter: renders the flipbook thumbnail strip with the carousel
 * rail — kinetic rail on mobile devices, native free strip on desktop. Spread
 * tiles compose their two page thumbnails; the flipbook package itself has no
 * carousel dependency (`renderThumbnails` slot).
 */
export function FlipbookThumbnailRail({ items, activeIndex, onSelect, label }: W1FlipbookThumbnailStripProps) {
  const deviceInfo = useBoundStore((state) => state.device)
  // Free strip until device detection is ready, so the first render is deterministic.
  const device = deviceInfo?.isReady && deviceInfo.is_deviceM ? 'mobile' : 'desktop'

  const railItems = useMemo<W1CarouselItem[]>(
    () =>
      items.map((item) => ({
        id: item.key,
        src: pageThumb(item.visualPages[0]),
        alt: item.label,
        tooltip: item.title,
        width: item.width,
        height: item.height,
      })),
    [items],
  )

  return (
    <div className={styles.rail}>
      <W1StripRail
        device={device}
        ariaLabel={label}
        selectionAria="current"
        items={railItems}
        selectedIndex={activeIndex}
        onSelect={onSelect}
        thumbHeightPx={THUMB_HEIGHT_PX}
        thumbFit="fitHeight"
        followSelection
        revealAlign="center"
        renderItem={(_, { index }) => <TileContent item={items[index]} />}
        gapPx={8}
        sidePaddingPx={12}
        thumbRadiusPx={4}
        thumbBorderWidth={0}
        activeBorderWidth={2}
        activeBorderOpacity={1}
        activeBorderColor="var(--w1-flipbook-thumb-active, #1a56db)"
      />
    </div>
  )
}

/** Stable `renderThumbnails` callback for `W1FlipbookBlock`. */
export const renderFlipbookThumbnailRail = (props: W1FlipbookThumbnailStripProps) => <FlipbookThumbnailRail {...props} />
