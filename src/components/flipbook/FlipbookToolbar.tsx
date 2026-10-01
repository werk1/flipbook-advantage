'use client'

import { W1Button } from '@werk1/w1-system-ui'
import type { W1FlipbookToolbarControls } from '@werk1/w1-system-flipbook'
import styles from './FlipbookToolbar.module.css'

function ToolButton({
  icon,
  label,
  onClick,
  pressed,
  disabled,
}: {
  icon: string
  label: string
  onClick: () => void
  pressed?: boolean
  disabled?: boolean
}) {
  return (
    <W1Button
      type="button"
      icon={icon}
      aria-label={label}
      title={label}
      onClick={onClick}
      pressed={pressed}
      disabled={disabled}
      appearance="ghost"
      tone="neutral"
      padding="xs"
      lineWidth="none"
      size="m"
      className={styles.tool}
    />
  )
}

/**
 * Viewer controls as W1 UI icon buttons (w1-system-ui `W1Button` + Lucide
 * icons): thumbnails, single/double page, zoom out/in, fullscreen.
 */
export function FlipbookToolbar({
  controls,
  orientation = 'horizontal',
}: {
  controls: W1FlipbookToolbarControls
  /** `vertical` stacks the buttons (icon column of the side arrangement). */
  orientation?: 'horizontal' | 'vertical'
}) {
  const { zoom, fullscreen, thumbnails, spread, labels } = controls
  return (
    <div className={orientation === 'vertical' ? `${styles.tools} ${styles.toolsVertical}` : styles.tools}>
      {thumbnails.enabled && (
        <ToolButton icon="gallery_thumbnails" label={labels.thumbnails} onClick={thumbnails.toggle} pressed={thumbnails.open} />
      )}
      {spread.enabled && (
        <ToolButton
          icon={spread.mode === 'double' ? 'page_single' : 'page_double'}
          label={spread.mode === 'double' ? (labels.spreadSingle ?? 'Single page view') : (labels.spreadDouble ?? 'Two page view')}
          onClick={spread.toggle}
        />
      )}
      {zoom.enabled && (
        // One zoom step: the magnifier zooms in, and out again while zoomed.
        <ToolButton
          icon={zoom.active ? 'zoom_out' : 'zoom_in'}
          label={zoom.active ? labels.zoomOut : labels.zoomIn}
          onClick={zoom.active ? zoom.zoomOut : zoom.zoomIn}
          pressed={zoom.active}
        />
      )}
      {fullscreen.enabled && (
        <ToolButton
          icon={fullscreen.active ? 'shrink' : 'expand'}
          label={fullscreen.active ? labels.exitFullscreen : labels.fullscreen}
          onClick={fullscreen.toggle}
          pressed={fullscreen.active}
        />
      )}
    </div>
  )
}

/** Slim top bar with only the viewer controls (deep link, page sections). */
export function FlipbookToolbarBar({ controls }: { controls: W1FlipbookToolbarControls }) {
  return (
    <div className={styles.bar}>
      <FlipbookToolbar controls={controls} />
    </div>
  )
}

/** Stable `renderToolbar` callback for embeds without the flipbook menu. */
export const renderFlipbookToolbarBar = (controls: W1FlipbookToolbarControls) => <FlipbookToolbarBar controls={controls} />
