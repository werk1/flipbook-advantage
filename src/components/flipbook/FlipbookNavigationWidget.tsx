'use client'

import { W1Select } from '@werk1/w1-system-ui'
import { WidgetArea, WidgetIcon, WidgetShell } from '@werk1/w1-system-widgets'
import type { W1FlipbookToolbarControls } from '@werk1/w1-system-flipbook'
import styles from './FlipbookNavigationWidget.module.css'

function RoundArrow({ icon, label, onClick, disabled }: { icon: 'chevron-left' | 'chevron-right'; label: string; onClick: () => void; disabled: boolean }) {
  // The round submit button of the widget search field.
  return (
    <button
      type="button"
      className={`w1-widget-search__submit ${styles.round}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <WidgetIcon name={icon} decorative />
    </button>
  )
}

/**
 * Bottom-bar navigation (passed as `renderNavigation`), built from the
 * w1-system-widgets layouts: a pill-shaped widget panel in the search tone
 * with the round previous button, the page field in its own search-field
 * pill (W1Select with the ticketing select popup), the round next button
 * and a quiet "PDF →" text link.
 */
export function FlipbookNavigationWidget({ controls }: { controls: W1FlipbookToolbarControls }) {
  const { navigation: nav, pdf, labels } = controls
  const rtl = nav.direction === 'rtl'
  const back = { label: labels.previous, onClick: nav.prev, disabled: !nav.canPrev }
  const forward = { label: labels.next, onClick: nav.next, disabled: !nav.canNext }

  return (
    // theme="light": light and dark come from the app palette (palettes.css).
    <WidgetArea label={labels.jumpTo} theme="light" className={styles.area}>
      <WidgetShell as="div" tone="search" className={styles.panel}>
        <div className={styles.row}>
          <RoundArrow icon="chevron-left" {...(rtl ? forward : back)} />
          <div className={`w1-widget-search ${styles.pagePill}`}>
            <W1Select
              value={String(nav.targetIndex)}
              onValueChange={(value) => {
                const target = nav.targets[Number(value)]
                if (target) nav.goTo(target.page)
              }}
              label={labels.jumpTo}
              labelHidden
              popupMode="custom"
              popoverSurface="liquid"
              tone="glass"
              rootClassName={styles.selectFieldWrap}
              fieldClassName={styles.pageField}
              popoverClassName={styles.selectPopover}
              suppressHydrationWarning
              options={nav.targets.map((target, index) => ({ value: String(index), label: target.range }))}
            />
          </div>
          <RoundArrow icon="chevron-right" {...(rtl ? back : forward)} />
          {/* A quiet text link, so it does not compete with the page arrows. */}
          <a className={styles.pdfLink} href={pdf.url} target="_blank" rel="noopener noreferrer" aria-label={pdf.label} title={pdf.label}>
            <span>PDF</span>
            <WidgetIcon name="arrow-right" decorative />
          </a>
        </div>
      </WidgetShell>
    </WidgetArea>
  )
}

/** Stable `renderNavigation` callback for `W1FlipbookBlock`. */
export const renderFlipbookNavigationWidget = (controls: W1FlipbookToolbarControls) => (
  <FlipbookNavigationWidget controls={controls} />
)
