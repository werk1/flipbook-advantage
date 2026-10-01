'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createFlipbookLabels } from '@/lib/blocks/flipbook/labels'
import type { FlipbookMenuItem } from '@/lib/blocks/flipbook/resolveFlipbookBlockInput'
import { useBoundStore } from '@/stores/boundStore'
import { W1FlipbookBlock, type W1FlipbookInput, type W1FlipbookToolbarControls } from '@werk1/w1-system-flipbook'
import { FlipbookHeader } from './FlipbookHeader'
import { renderFlipbookNavigationWidget } from './FlipbookNavigationWidget'
import styles from './FlipbookReader.module.css'
import { FlipbookSideChrome } from './FlipbookSideChrome'
import { renderFlipbookThumbnailRail } from './FlipbookThumbnailRail'
import { FlipbookToolbar, renderFlipbookToolbarBar } from './FlipbookToolbar'
import { readerDeviceClassNames, resolveReaderLayout } from './readerDevice'

type FlipbookReaderProps = {
  input: W1FlipbookInput
  locale: string
  /** Header with the cross-flipbook menu; the Flipbook-Host homepage shows
   * it, the canonical deep link (`/flipbooks/[slug]`, also used as the
   * embed link) never does. */
  showHeader?: boolean
  items?: FlipbookMenuItem[]
  activeSlug?: string
  siteTitle?: string
}

const subscribeNever = () => () => {}

/** False on the server and during hydration, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(subscribeNever, () => true, () => false)
}

export function FlipbookReader({ input, locale, showHeader = false, items = [], activeSlug, siteTitle }: FlipbookReaderProps) {
  const deviceInfo = useBoundStore((state) => state.device)
  const labels = useMemo(() => createFlipbookLabels(locale), [locale])
  const hydrated = useHydrated()

  // The structure is chosen once, here. Server render and hydration always
  // use the default structure; phone layouts follow once device-info is
  // ready. The viewer keeps its tree position in every layout, so switching
  // (device ready, rotation) changes the chrome without remounting it.
  const device = hydrated ? deviceInfo : undefined
  const layout = resolveReaderLayout(device)
  const deviceClasses = readerDeviceClassNames(device, layout)

  // The reader owns the current page, so a layout switch keeps the position.
  const [page, setPage] = useState(input.config?.startPage ?? 0)

  // The generic phone-landscape "please rotate" overlay would otherwise hide
  // the reader; the flipbook viewer supports landscape (two-page spread).
  useEffect(() => {
    useBoundStore.getState().setSuppressLandscapeOverlay(true)
    return () => useBoundStore.getState().setSuppressLandscapeOverlay(false)
  }, [])

  const handlePageChange = useCallback((next: number) => {
    setPage(next)
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(next + 1))
    window.history.replaceState(window.history.state, '', url)
  }, [])

  // The menu bar carries the viewer controls; it sits inside the viewer so
  // it stays visible in fullscreen. Without the menu a slim bar holds them.
  const renderHeaderToolbar = useCallback(
    (controls: W1FlipbookToolbarControls) => (
      <FlipbookHeader
        items={items}
        activeSlug={activeSlug}
        locale={locale}
        title={siteTitle ?? ''}
        tools={<FlipbookToolbar controls={controls} />}
      />
    ),
    [items, activeSlug, locale, siteTitle],
  )

  // Phone landscape: one slim bar (pictogram, counter, icons) beside the
  // pages so the double spread keeps its width, vertical rail at the end.
  const renderSideChrome = useCallback(
    (controls: W1FlipbookToolbarControls) => (
      <FlipbookSideChrome controls={controls} title={siteTitle} />
    ),
    [siteTitle],
  )
  const side = layout === 'phoneLandscape'
  const renderToolbar = side ? renderSideChrome : showHeader ? renderHeaderToolbar : renderFlipbookToolbarBar

  return (
    <main
      className={[styles.reader, ...deviceClasses].join(' ')}
      data-reader-layout={layout}
      data-reader-chrome={showHeader ? 'header' : 'bar'}
    >
      <div className={styles.viewer}>
        <W1FlipbookBlock
          input={input}
          labels={labels}
          page={page}
          onPageChange={handlePageChange}
          deviceInfo={deviceInfo}
          renderThumbnails={renderFlipbookThumbnailRail}
          renderToolbar={renderToolbar}
          renderNavigation={renderFlipbookNavigationWidget}
          chromeLayout={side ? 'side' : 'stacked'}
          fill
        />
      </div>
    </main>
  )
}
