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
    counter: (range, count) => `Seite ${range} | ${count}`,
    search: 'Suche',
    searchPlaceholder: 'Im Dokument suchen …',
    searchNoResults: 'Keine Treffer.',
    searchError: 'Die Suche ist fehlgeschlagen.',
    searchPage: (page) => `S. ${page}`,
    textSelect: 'Text auswählen',
    exitTextSelect: 'Textauswahl beenden',
    pdfLinkPage: (page) => `Zu Seite ${page}`,
    showLinks: 'Links zeigen',
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
    counter: (range, count) => `Page ${range} | ${count}`,
    search: 'Search',
    searchPlaceholder: 'Search the document …',
    searchNoResults: 'No results.',
    searchError: 'Search failed.',
    searchPage: (page) => `p. ${page}`,
    textSelect: 'Select text',
    exitTextSelect: 'Stop selecting text',
    pdfLinkPage: (page) => `Go to page ${page}`,
    showLinks: 'Show links',
  },
}

/** Counter with a custom word before the pages; an empty word leaves the numbers: "58–59 | 78". */
const counterWith =
  (word: string): W1FlipbookLabels['counter'] =>
  (range, count) =>
    `${word ? `${word} ` : ''}${range} | ${count}`

export interface FlipbookLabelOptions {
  /** Numbers only, for narrow status bars (phone portrait). */
  compactCounter?: boolean
  /**
   * Word before the pages (Site Settings): undefined keeps the language
   * default ("Seite" / "Page"), an empty string shows numbers only.
   */
  pageWord?: string
}

export function createFlipbookLabels(locale: string, options: FlipbookLabelOptions = {}): W1FlipbookLabels {
  const labels = locale === 'de' ? LABELS.de : LABELS.en
  if (options.compactCounter) return { ...labels, counter: counterWith('') }
  return options.pageWord === undefined ? labels : { ...labels, counter: counterWith(options.pageWord) }
}

/** Texts of the reader's search panel (FlipbookSearchPanel); the viewer labels cover the rest. */
export interface FlipbookSearchPanelLabels {
  close: string
  previousHit: string
  nextHit: string
  minChars: (count: number) => string
  pending: string
  hits: (count: number) => string
  /** Placeholder of the short landscape field. */
  shortPlaceholder: string
  /** Magnifier of the landscape field: open it / fold it (the query stays). */
  expandField: string
  collapseField: string
  /** Name of the landscape hit list beside the icon column. */
  results: string
  /** On/off toggle of the landscape hit list. */
  list: string
  /** Search range above the field: this issue / all issues of the series. */
  scopeLabel: string
  scopeIssue: string
  scopeAll: string
  /** Placeholder of the field while all issues are searched. */
  placeholderAll: string
}

const SEARCH_PANEL_LABELS: Record<'de' | 'en', FlipbookSearchPanelLabels> = {
  de: {
    close: 'Suche schließen',
    previousHit: 'Vorheriger Treffer',
    nextHit: 'Nächster Treffer',
    minChars: (count) => `Mindestens ${count} Zeichen eingeben.`,
    pending: 'Suche läuft …',
    hits: (count) => (count === 1 ? '1 Treffer' : `${count} Treffer`),
    shortPlaceholder: 'Suchen',
    expandField: 'Suchfeld öffnen',
    collapseField: 'Suchfeld einklappen',
    results: 'Suchergebnisse',
    list: 'Trefferliste',
    scopeLabel: 'Suchbereich',
    scopeIssue: 'Diese Ausgabe',
    scopeAll: 'Alle Ausgaben',
    placeholderAll: 'In allen Ausgaben suchen …',
  },
  en: {
    close: 'Close search',
    previousHit: 'Previous result',
    nextHit: 'Next result',
    minChars: (count) => `Type at least ${count} characters.`,
    pending: 'Searching …',
    hits: (count) => (count === 1 ? '1 result' : `${count} results`),
    shortPlaceholder: 'Search',
    expandField: 'Open search field',
    collapseField: 'Collapse search field',
    results: 'Search results',
    list: 'Result list',
    scopeLabel: 'Search range',
    scopeIssue: 'This issue',
    scopeAll: 'All issues',
    placeholderAll: 'Search all issues …',
  },
}

export function createFlipbookSearchPanelLabels(locale: string): FlipbookSearchPanelLabels {
  return locale === 'de' ? SEARCH_PANEL_LABELS.de : SEARCH_PANEL_LABELS.en
}
