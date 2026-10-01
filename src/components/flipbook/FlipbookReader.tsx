'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { createFlipbookLabels } from '@/lib/blocks/flipbook/labels'
import type { FlipbookMenuItem } from '@/lib/blocks/flipbook/resolveFlipbookBlockInput'
import { useBoundStore } from '@/stores/boundStore'
import { W1FlipbookBlock, type W1FlipbookInput } from '@werk1/w1-system-flipbook'
import { FlipbookHeader } from './FlipbookHeader'
import { renderFlipbookThumbnailRail } from './FlipbookThumbnailRail'

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

export function FlipbookReader({ input, locale, showHeader = false, items = [], activeSlug, siteTitle }: FlipbookReaderProps) {
  const deviceInfo = useBoundStore((state) => state.device)
  const labels = useMemo(() => createFlipbookLabels(locale), [locale])

  // The generic phone-landscape "please rotate" overlay would otherwise hide
  // the reader; the flipbook viewer supports landscape (two-page spread).
  useEffect(() => {
    useBoundStore.getState().setSuppressLandscapeOverlay(true)
    return () => useBoundStore.getState().setSuppressLandscapeOverlay(false)
  }, [])

  const syncUrl = useCallback((page: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(page + 1))
    window.history.replaceState(window.history.state, '', url)
  }, [])

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--w1-flipbook-surface, #ecebe8)' }}>
      {showHeader && <FlipbookHeader items={items} activeSlug={activeSlug} locale={locale} title={siteTitle ?? ''} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <W1FlipbookBlock
          input={input}
          labels={labels}
          deviceInfo={deviceInfo}
          onPageChange={syncUrl}
          renderThumbnails={renderFlipbookThumbnailRail}
          fill
        />
      </div>
    </main>
  )
}
