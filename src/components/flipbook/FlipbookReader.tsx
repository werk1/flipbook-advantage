'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { createFlipbookLabels } from '@/lib/blocks/flipbook/labels'
import type { FlipbookMenuItem } from '@/lib/blocks/flipbook/resolveFlipbookBlockInput'
import { useBoundStore } from '@/stores/boundStore'
import { W1FlipbookBlock, type W1FlipbookInput } from '@werk1/w1-system-flipbook'
import { FlipbookHeader } from './FlipbookHeader'

type FlipbookReaderProps = {
  input: W1FlipbookInput
  locale: string
  items: FlipbookMenuItem[]
  activeSlug?: string
  siteTitle: string
  /** Header mit Flipbook-Menü nur zeigen, wenn vom Listing kommend (?nav=1). */
  showNav?: boolean
}

export function FlipbookReader({ input, locale, items, activeSlug, siteTitle, showNav }: FlipbookReaderProps) {
  const deviceInfo = useBoundStore((state) => state.device)
  const setSuppressLandscapeOverlay = useBoundStore((state) => state.setSuppressLandscapeOverlay)
  const labels = useMemo(() => createFlipbookLabels(locale), [locale])

  // Der Reader zeigt Doppelseiten wie auf dem Desktop; das app-weite
  // Landscape-QR-Overlay darf ihn auf Phone-Landscape nicht verdecken.
  useEffect(() => {
    setSuppressLandscapeOverlay(true)
    return () => setSuppressLandscapeOverlay(false)
  }, [setSuppressLandscapeOverlay])

  const syncUrl = useCallback((page: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(page + 1))
    window.history.replaceState(window.history.state, '', url)
  }, [])

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--w1-flipbook-surface, #ecebe8)' }}>
      {showNav ? <FlipbookHeader items={items} activeSlug={activeSlug} locale={locale} title={siteTitle} /> : null}
      <div style={{ flex: 1, minHeight: 0 }}>
        <W1FlipbookBlock input={input} labels={labels} deviceInfo={deviceInfo} onPageChange={syncUrl} fill />
      </div>
    </main>
  )
}
