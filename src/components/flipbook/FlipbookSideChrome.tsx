'use client'

import type { ReactNode } from 'react'
import type { W1FlipbookToolbarControls } from '@werk1/w1-system-flipbook'
import { FlipbookSearchButton, FlipbookToolbar } from './FlipbookToolbar'
import styles from './FlipbookSideChrome.module.css'

/**
 * Start column of the phone- and tablet-landscape reader (`chromeLayout="side"`). One
 * slim bar so the double spread keeps its width: the search on/off at the
 * top, level with the search field of the icon column beside it, the other
 * viewer controls as icon buttons at the bottom and below them the page
 * counter as a fraction (pages over page count). No client mark: a round
 * pictogram among the tools reads as one more button, and the brand stands
 * in the header as soon as the device is turned.
 */
export function FlipbookSideChrome({
  controls,
  status,
  showSearch = true,
  onSearch,
  searchColumn,
}: {
  controls: W1FlipbookToolbarControls
  status?: ReactNode
  /** Search on/off at the top of the bar. */
  showSearch?: boolean
  /** Search button action (reader search sheet). */
  onSearch?: () => void
  /**
   * Search icon column beside the menu bar while the search runs
   * (`FlipbookSearchIconColumn`). It takes layout width of its own, so the
   * pages give it room.
   */
  searchColumn?: ReactNode
}) {
  const { navigation } = controls
  return (
    <>
    <div className={styles.sideChrome}>
      {showSearch && (
        <div className={styles.search}>
          <FlipbookSearchButton controls={controls} onSearch={onSearch} />
        </div>
      )}
      <div className={styles.status} aria-live="polite">
        {status}
      </div>
      <div className={styles.tools}>
        <FlipbookToolbar controls={controls} orientation="vertical" showSearch={false} />
      </div>
      {/* Counter as a fraction below the icons: pages over the page count. */}
      <p className={styles.counter} title={navigation.counter} aria-hidden="true" data-testid="flipbook-side-counter">
        <span>{navigation.range}</span>
        <span className={styles.counterRule} />
        <span>{navigation.count}</span>
      </p>
    </div>
    {searchColumn}
    </>
  )
}
