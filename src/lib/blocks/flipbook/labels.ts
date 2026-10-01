import type { W1FlipbookLabels } from '@werk1/w1-system-flipbook/types'

const LABELS: Record<'de' | 'en', W1FlipbookLabels> = {
  de: {
    previous: 'Vorherige Seite',
    next: 'Nächste Seite',
    pageStatus: (page, count) => `Seite ${page} von ${count}`,
    jumpTo: 'Zu Seite springen',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    zoomReset: 'Zoom schließen',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    thumbnails: 'Seitenübersicht',
    close: 'Schließen',
    openPdf: 'PDF öffnen',
    imageError: 'Eine Seite konnte nicht geladen werden.',
    retry: 'Erneut versuchen',
    spreadSingle: 'Einzelseitenansicht',
    spreadDouble: 'Doppelseitenansicht',
    thumbnailSpread: (first, last) => `Seiten ${first}–${last}`,
    counter: (range, count) => `Seite ${range} / ${count}`,
  },
  en: {
    previous: 'Previous page',
    next: 'Next page',
    pageStatus: (page, count) => `Page ${page} of ${count}`,
    jumpTo: 'Jump to page',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomReset: 'Close zoom',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    thumbnails: 'Page overview',
    close: 'Close',
    openPdf: 'Open PDF',
    imageError: 'A page could not be loaded.',
    retry: 'Retry',
    spreadSingle: 'Single page view',
    spreadDouble: 'Two page view',
    thumbnailSpread: (first, last) => `Pages ${first}–${last}`,
    counter: (range, count) => `Page ${range} / ${count}`,
  },
}

export function createFlipbookLabels(locale: string): W1FlipbookLabels {
  return locale === 'de' ? LABELS.de : LABELS.en
}
