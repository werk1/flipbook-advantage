'use client'

import type { ReactNode } from 'react'
import type { W1FlipbookToolbarControls } from '@werk1/w1-system-flipbook'
import { FlipbookToolbar } from './FlipbookToolbar'
import styles from './FlipbookSideChrome.module.css'

/**
 * Start column of the phone-landscape reader (`chromeLayout="side"`). One
 * slim bar so the double spread keeps its width: pictogram of the client on
 * top, compact page counter below it, the viewer controls as icon buttons at
 * the bottom.
 */
export function FlipbookSideChrome({
  controls,
  title,
  pictogram,
  status,
}: {
  controls: W1FlipbookToolbarControls
  /** Client name; its initial stands in until a pictogram asset exists. */
  title?: string
  /** Client pictogram (square); reserved slot at the top of the bar. */
  pictogram?: ReactNode
  status?: ReactNode
}) {
  const { navigation } = controls
  return (
    <div className={styles.sideChrome}>
      {/* Decorative; the viewer announces pages through its own status region. */}
      <div className={styles.pictogram} title={title} aria-hidden="true">
        {pictogram ?? title?.charAt(0)}
      </div>
      <p className={styles.counter} title={navigation.counter} aria-hidden="true" data-testid="flipbook-side-counter">
        <span>{navigation.range}</span>
        <span>/ {navigation.count}</span>
      </p>
      <div className={styles.status} aria-live="polite">
        {status}
      </div>
      <div className={styles.tools}>
        <FlipbookToolbar controls={controls} orientation="vertical" />
      </div>
    </div>
  )
}
