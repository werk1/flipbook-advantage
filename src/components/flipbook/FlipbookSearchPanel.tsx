'use client'

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { W1Button } from '@werk1/w1-system-ui'
import { WidgetArea, WidgetIcon, WidgetResultLink, WidgetResultList, WidgetSearch, WidgetShell } from '@werk1/w1-system-widgets'
import type { W1FlipbookSearchHit, W1FlipbookSearchPanelProps, W1FlipbookToolbarControls } from '@werk1/w1-system-flipbook'
import { createFlipbookSearchPanelLabels } from '@/lib/blocks/flipbook/labels'
import styles from './FlipbookSearchPanel.module.css'
import themeStyles from './FlipbookWidgetTheme.module.css'

/**
 * Where the reader shows its search:
 * - `sidebar` (desktop): classic sidebar at the start of the viewer
 *   (`searchPlacement="start"`); collapsed it is an icon column.
 * - `top` (phone/tablet portrait): sheet over the pages from the top, clear
 *   of the navigation widget at the bottom.
 * - `column` (phone/tablet landscape): field and hits over the pages,
 *   growing out of the search icon column (`FlipbookSearchIconColumn`) that
 *   stands beside the menu bar; see that component for the split.
 */
export type FlipbookSearchVariant = 'sidebar' | 'top' | 'column'

const cx = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(' ')

// Landscape field (FlipbookSearchPanel.module.css `.expandField`): room for
// the text at least, the frame around it (hairline, the magnifier with its
// inset and gap, the right padding) and the clear button once there is text.
const FIELD_MIN_TEXT = 96
const FIELD_CHROME = 61
const FIELD_CLEAR = 25

// Same rules as the document index (normalizeTerms in w1-system-pdfedit):
// case, diacritics and ß do not count, the last term also matches as a prefix.
const fold = (text: string) => text.normalize('NFKD').replace(/\p{M}+/gu, '').replace(/ß/g, 'ss').toLowerCase()

/** The snippet with the words that matched the query marked. */
function highlightTerms(snippet: string, query: string): ReactNode {
  const terms = fold(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const last = terms.at(-1)
  if (!last) return snippet
  const parts: ReactNode[] = []
  let from = 0
  for (const match of snippet.matchAll(/[\p{L}\p{N}]+/gu)) {
    const word = fold(match[0])
    if (!terms.includes(word) && !word.startsWith(last)) continue
    if (match.index > from) parts.push(snippet.slice(from, match.index))
    parts.push(
      <mark key={match.index} className={styles.match}>
        {match[0]}
      </mark>,
    )
    from = match.index + match[0].length
  }
  if (parts.length === 0) return snippet
  parts.push(snippet.slice(from))
  return parts
}

/**
 * Search icon column of the landscape reader, beside the menu bar. On top
 * sits the search field itself, collapsed to a round magnifier: the panel
 * renders it into `fieldHostRef` (a portal, because the field needs the
 * search session and has to lie over the pages, which clip their own layer).
 * A tap lets it grow to the right over the pages. Below it the two hit
 * arrows and the list toggle, all round icons like the tools next door. The
 * column takes layout width, so the pages give it room; the field and the
 * list lie over them. Switching the search on and off stays with the menu
 * bar next door.
 */
export function FlipbookSearchIconColumn({
  controls,
  expanded,
  onExpandedChange,
  fieldHostRef,
  locale,
}: {
  controls: W1FlipbookToolbarControls
  /** The hit list under the field is shown. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Slot of the expandable field (`FlipbookSearchPanel` `fieldHost`). */
  fieldHostRef: (element: HTMLDivElement | null) => void
  locale: string
}) {
  const { search, labels } = controls
  const text = createFlipbookSearchPanelLabels(locale)
  const label = labels.search ?? 'Suche'
  // Same round buttons as in the portrait sheet (`.toolToggle`).
  const icon = (name: string, title: string, onClick: () => void, options: { disabled?: boolean; pressed?: boolean; className?: string } = {}) => (
    <W1Button
      type="button"
      icon={name}
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={options.disabled}
      pressed={options.pressed}
      appearance="ghost"
      tone="neutral"
      padding="xs"
      lineWidth="none"
      size="m"
      className={cx(styles.toolToggle, options.className)}
    />
  )
  return (
    <div className={styles.iconColumn} aria-label={label}>
      {/* The search controls in the frame of the navigation widget, upright:
          the field (collapsed to its magnifier, it grows out of the frame to
          the right) and the hit arrows — the hits are a list, stepping reads
          up and down. */}
      <div className={styles.columnFrame}>
        <div ref={fieldHostRef} className={styles.fieldHost} />
        {icon('chevron_up', text.previousHit, search.prevHit, { disabled: !search.canPrevHit })}
        {icon('chevron_down', text.nextHit, search.nextHit, { disabled: !search.canNextHit })}
      </div>
      {/* Outside the frame, like the fold chevron beside the portrait pill:
          it belongs to the panel. An on/off toggle for the hit list. */}
      {icon('list_view', text.list, () => onExpandedChange(!expanded), { pressed: expanded, className: styles.listToggle })}
    </div>
  )
}

/** Deep link of a hit: the reader URL with its `?page=` (open in a new tab). */
function pageHref(pageIndex: number) {
  const url = new URL(window.location.href)
  url.searchParams.set('page', String(pageIndex + 1))
  return `${url.pathname}${url.search}`
}

/**
 * Search panel of the reader (`renderSearch`), built from the widget search
 * field and result list. The viewer owns the session (query, hits, picked
 * hit); this panel only adds `expanded`: collapsed, the portrait sheet keeps
 * just the search bar with the query; in landscape `expanded` is the hit
 * list under the field, which stays on its own. The desktop sidebar does not
 * fold; its X closes the search.
 */
export function FlipbookSearchPanel({
  panel,
  variant,
  expanded,
  onExpandedChange,
  fieldHost,
  locale,
  currentTitle,
}: {
  panel: W1FlipbookSearchPanelProps
  variant: FlipbookSearchVariant
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Landscape: slot of the expandable field in the search icon column. */
  fieldHost?: HTMLElement | null
  locale: string
  /** Name of this issue: the heading of its hits next to those of other issues. */
  currentTitle?: string
}) {
  const { open, setOpen, query, setQuery, scopes, scope, setScope, status, hits: allHits, selected, select, minChars, labels } = panel
  // Stepping and the marked hit belong to this issue; hits of other issues are links.
  const hits = allHits.filter((hit) => !hit.document)
  const otherHits = allHits.filter((hit) => hit.document)
  const otherGroups: { doc: NonNullable<W1FlipbookSearchHit['document']>; name: string; hits: W1FlipbookSearchHit[] }[] = []
  for (const hit of otherHits) {
    const doc = hit.document!
    let group = otherGroups.find((g) => g.doc.id === doc.id)
    if (!group) otherGroups.push((group = { doc, name: [doc.title, doc.issue].filter(Boolean).join(' · '), hits: [] }))
    group.hits.push(hit)
  }
  const grouped = otherGroups.length > 0
  const heading = (name: string) => (
    <div role="presentation" className={styles.groupTitle}>
      {name}
    </div>
  )
  const text = createFlipbookSearchPanelLabels(locale)
  const inputId = useId()
  const headRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const sheet = variant !== 'sidebar'
  // Landscape splits the panel: the icon column carries the controls and the
  // expandable field, the hit list opens beside the column on demand.
  const split = variant === 'column'
  const showResults = open && expanded
  const label = labels.search ?? 'Suche'
  const input = () => headRef.current?.querySelector('input') ?? null

  // Landscape field: a round magnifier until it is tapped, then it grows to
  // the right; it stays open while it holds a query, so the reader sees what
  // the arrows walk through. The magnifier toggles it: empty it opens the
  // field for typing, filled it folds the field back and keeps the query
  // (`fieldCollapsed`), and a second tap shows it again.
  const [fieldFocused, setFieldFocused] = useState(false)
  const [fieldCollapsed, setFieldCollapsed] = useState(false)
  const fieldOpen = !fieldCollapsed && (fieldFocused || query !== '')
  const measureRef = useRef<HTMLSpanElement>(null)
  // While typing the field follows its text up to the maximum width set in
  // CSS: the hidden copy of the text gives the width, written straight to
  // the element so typing causes no extra render.
  useLayoutEffect(() => {
    const field = headRef.current
    const measure = measureRef.current
    if (!split || !field || !measure) return
    field.style.width = fieldOpen
      ? `${Math.max(FIELD_MIN_TEXT, measure.offsetWidth) + FIELD_CHROME + (query ? FIELD_CLEAR : 0)}px`
      : ''
  })

  // Opening the search moves the focus into the field on devices with a
  // mouse — folding the hits in and out does not, so the chevron never
  // activates the field. Touch devices never focus it on their own: the
  // on-screen keyboard would come up although the reader may only want to
  // walk through a search that is already there; a tap into the field is
  // enough to type.
  const wasOpen = useRef(open)
  useEffect(() => {
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (open && !wasOpen.current && !touch) input()?.focus({ preventScroll: true })
    // Switched on again, the landscape field shows its query.
    if (!open) setFieldCollapsed(false)
    wasOpen.current = open
  }, [open])

  // A touch outside the field ends the typing at once and closes the
  // on-screen keyboard — also when it lands on something that takes no
  // focus (the pages, the sheet, a scroll through the hits), where the
  // browser would leave the field focused. The field's own clear button is
  // part of the input and keeps it; so does the magnifier of the landscape
  // field, which decides itself what its tap does.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      const field = input()
      if (!field || document.activeElement !== field) return
      const zone = (split ? headRef.current : field.closest('form')) ?? field
      if (event.target instanceof Node && zone.contains(event.target)) return
      field.blur()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, split])

  // The first hits bring the list up, so it is clear that there are any —
  // when a query goes from no hit to hits while the search is on. Refining a
  // query that already has hits leaves a list the reader closed alone, and
  // switching the search on and off is no new first hit. Only finished
  // queries count: while one runs the hits are empty for a moment. They are
  // the hits the list shows, those of other issues included.
  const hitCount = useRef(allHits.length)
  useEffect(() => {
    if (!open) return
    if (status === 'idle') hitCount.current = 0
    if (status !== 'done') return
    if (sheet && hitCount.current === 0 && allHits.length > 0) onExpandedChange(true)
    hitCount.current = allHits.length
  }, [open, sheet, status, allHits.length, onExpandedChange])

  // The picked hit stays in view: when the list opens it scrolls to the card
  // the arrows last walked to, instead of starting at the top again.
  useEffect(() => {
    if (!showResults) return
    bodyRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  })

  // Escape folds the hits away; the query and the marked hit are kept. Where
  // the bar is the whole panel it hides with them; the landscape field gives
  // up the focus and, empty, shrinks back into its magnifier.
  const hide = () => {
    if (sheet && !split) setOpen(false)
    if (split) input()?.blur()
    onExpandedChange(false)
  }
  // On the sheets a picked hit folds the results away, so its marked block
  // on the page is not covered; the sidebar stays open for the next hit.
  const pick = (hit: W1FlipbookSearchHit) => {
    select(hit)
    if (!sheet) return
    onExpandedChange(false)
    input()?.blur()
  }
  // Step through the hits without folding anything: with the results closed
  // the bar alone walks the document, like find-in-page. Hits are compared by
  // value, because reopening the search re-runs the query and hands out new
  // objects for the same hits.
  const sameHit = (a: W1FlipbookSearchHit | null, b: W1FlipbookSearchHit | null) =>
    Boolean(a && b && a.pageIndex === b.pageIndex && a.snippet === b.snippet)
  const position = selected ? hits.findIndex((hit) => sameHit(hit, selected)) : -1
  // No wrap-around: the arrows grey out at the ends of the list. Without a
  // pick yet, "next" starts at the first hit.
  const canPrev = position > 0
  const canNext = hits.length > 0 && position < hits.length - 1
  const step = (delta: 1 | -1) => () => {
    const next = position < 0 ? 0 : position + delta
    if (next < 0 || next >= hits.length) return
    select(hits[next])
  }
  // No submit button: the field searches as you type, Enter only closes the
  // on-screen keyboard.
  const submit = (event: FormEvent) => {
    event.preventDefault()
    input()?.blur()
  }

  // Closed, nothing of the panel is left: the viewer's search button is the
  // on/off, in the toolbar on desktop and portrait, in the menu bar of the
  // landscape reader.
  if (!open) return null

  const note =
    status === 'idle'
      ? query.trim()
        ? text.minChars(minChars)
        : undefined
      : status === 'pending'
        ? text.pending
        : status === 'failed'
          ? (labels.searchError ?? 'Search failed.')
          : allHits.length === 0
            ? (labels.searchNoResults ?? 'No results.')
            : text.hits(allHits.length)

  // Round ghost buttons like the toggles of the navigation widget.
  const tool = (icon: string, title: string, onClick: () => void, pressed?: boolean) => (
    <W1Button
      type="button"
      icon={icon}
      aria-label={title}
      title={title}
      pressed={pressed}
      onClick={onClick}
      appearance="ghost"
      tone="neutral"
      padding="xs"
      lineWidth="none"
      size="m"
      className={cx(styles.toolToggle, pressed !== undefined && styles.listToggle)}
    />
  )

  // Previous / next hit at the end of the field, in the round style the
  // navigation widget uses for its page arrows.
  const hitArrow = (icon: 'chevron-left' | 'chevron-right', title: string, onClick: () => void, enabled: boolean) => (
    <button
      type="button"
      className={`w1-widget-search__submit ${styles.hitArrow}`}
      onClick={onClick}
      disabled={!enabled}
      aria-label={title}
      title={title}
    >
      <WidgetIcon name={icon} decorative />
    </button>
  )

  // Search range, above the field: this issue or all issues of the series.
  // Only when the flipbook has a series with other searchable issues.
  const scopeSwitch = scopes.length > 1 && (
    <div className={styles.scope} role="radiogroup" aria-label={text.scopeLabel}>
      {scopes.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={scope === id}
          className={cx(styles.scopeOption, scope === id && styles.scopeOptionOn)}
          onClick={() => setScope(id)}
        >
          {id === 'all' ? text.scopeAll : text.scopeIssue}
        </button>
      ))}
    </div>
  )

  const field = (
    <WidgetSearch
      className={styles.field}
      inputId={inputId}
      label={label}
      clearable
      onSubmit={submit}
      input={{
        value: query,
        // The landscape field starts short, so it asks with one word.
        placeholder: split ? text.shortPlaceholder : scope === 'all' ? text.placeholderAll : labels.searchPlaceholder,
        autoComplete: 'off',
        enterKeyHint: 'search',
        onChange: (event) => setQuery(event.target.value),
        onFocus: () => {
          // Landscape: the field opens; the list stays as it is, it is shown
          // on demand once the keyboard is closed.
          if (split) {
            setFieldFocused(true)
            setFieldCollapsed(false)
          }
          // Typing into the folded field brings the results back.
          else if (!expanded) onExpandedChange(true)
        },
        onBlur: () => setFieldFocused(false),
        onKeyDown: (event) => {
          if (event.key !== 'Escape') return
          event.stopPropagation()
          hide()
        },
      }}
    />
  )

  // The magnifier of the landscape field: open, it folds the field (a query
  // stays); folded and filled, it shows the field again without the
  // keyboard; folded and empty, it opens the field for typing. The focus is
  // set in the same tap, so the on-screen keyboard comes up (iOS only raises
  // it for a focus inside the touch itself).
  const toggleField = () => {
    const element = input()
    if (fieldOpen) {
      element?.blur()
      if (query) setFieldCollapsed(true)
      return
    }
    if (query) setFieldCollapsed(false)
    else element?.focus()
  }

  const head = split ? (
    <div
      ref={headRef}
      className={cx(styles.expandField, fieldOpen && styles.expandFieldOpen, fieldOpen && query !== '' && styles.expandFieldFilled)}
    >
      <span ref={measureRef} className={styles.expandMeasure} aria-hidden="true">
        {query || text.shortPlaceholder}
      </span>
      {field}
      <button
        type="button"
        className={styles.expandToggle}
        aria-label={fieldOpen ? text.collapseField : text.expandField}
        title={fieldOpen ? text.collapseField : text.expandField}
        aria-expanded={fieldOpen}
        // The button must not take the focus from the field on press, or
        // the field would already have closed when the tap arrives.
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleField}
      >
        {/* The magnifier, until the open field holds text: then a chevron
            pointing the way the field shrinks back, as that is when the
            spot folds it and keeps the query. */}
        <WidgetIcon name="search" decorative className={styles.expandIconClosed} />
        <WidgetIcon name="chevron-left" decorative className={styles.expandIconOpen} />
      </button>
    </div>
  ) : (
    <div ref={headRef} className={styles.head}>
      {field}
      {/* Beside the field, like the page arrows of the navigation widget. */}
      {hitArrow('chevron-left', text.previousHit, step(-1), canPrev)}
      {hitArrow('chevron-right', text.nextHit, step(1), canNext)}
    </div>
  )

  // Outside the widget: it belongs to the sheet, not to the search controls.
  // The viewer's search button hides the whole panel, so there is no close
  // button beside it. In portrait it is the on/off toggle of the hit list,
  // the same list icon as in the landscape icon column.
  // Desktop: the sidebar has nothing to fold into, so its button closes the
  // search — the same as a second click on the search button in the top bar.
  const foldToggle =
    variant === 'sidebar'
      ? tool('close', text.close, () => {
          setOpen(false)
          onExpandedChange(false)
        })
      : tool('list_view', text.list, () => onExpandedChange(!expanded), expanded)

  const results = showResults && (
    <div ref={bodyRef} className={styles.body}>
      {/* Landscape: the field lives in the icon column, so the switch tops the list. */}
      {split && scopeSwitch}
      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}
      {allHits.length > 0 && (
        <WidgetResultList className={styles.results}>
          {/* With hits in other issues every issue is a group: its name in bold,
              then its hits. This issue comes first. */}
          {grouped && hits.length > 0 && heading(currentTitle ?? label)}
          {hits.map((hit, index) => (
            <WidgetResultLink
              key={`${hit.pageIndex}-${index}`}
              href={pageHref(hit.pageIndex)}
              title={highlightTerms(hit.snippet, query)}
              arrow={false}
              // The page stands as a bare number in the card's own column, like
              // a table of contents; the link name keeps the full page label.
              accent={String(hit.pageIndex + 1)}
              aria-label={`${labels.searchPage ? labels.searchPage(hit.pageIndex + 1) : `S. ${hit.pageIndex + 1}`}: ${hit.snippet}`}
              aria-current={sameHit(hit, selected) ? 'true' : undefined}
              className={styles.hit}
              onClick={(event) => {
                // Plain click jumps in the reader; modified clicks open the link.
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
                event.preventDefault()
                pick(hit)
              }}
            />
          ))}
          {/* Hits of the other issues follow as plain links in the same tab. */}
          {otherGroups.map((group) => (
            <Fragment key={group.doc.id}>
              {heading(group.name)}
              {group.hits.map((hit, index) => (
                <WidgetResultLink
                  key={`${group.doc.id}-${hit.pageIndex}-${index}`}
                  href={hit.document!.href}
                  title={highlightTerms(hit.snippet, query)}
                  arrow={false}
                  accent={String(hit.pageIndex + 1)}
                  aria-label={`${group.name}, ${labels.searchPage ? labels.searchPage(hit.pageIndex + 1) : `S. ${hit.pageIndex + 1}`}: ${hit.snippet}`}
                  className={styles.hit}
                />
              ))}
            </Fragment>
          ))}
        </WidgetResultList>
      )}
    </div>
  )

  if (variant === 'sidebar') {
    return (
      <WidgetArea label={label} theme="light" className={cx(themeStyles.theme, styles.area, styles.sidebar)}>
        {/* Title row of the sidebar: the X closes the whole search, so it
            belongs to the sidebar, not beside the field — which gets the full
            width of the pill. */}
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{label}</h2>
          {foldToggle}
        </div>
        {scopeSwitch}
        <WidgetShell as="div" tone="search" className={styles.bar}>
          {head}
        </WidgetShell>
        {results}
      </WidgetArea>
    )
  }

  // Landscape: the field lives in the icon column (portal into its slot, with
  // a widget area of its own for the tokens) and grows from there over the
  // pages. The hit list opens on demand beside the column, as a sheet whose
  // top leaves room for the field lying over it.
  if (split) {
    return (
      <>
        {fieldHost &&
          createPortal(
            <WidgetArea label={label} theme="light" className={cx(themeStyles.theme, styles.area, styles.expandArea)}>
              {head}
            </WidgetArea>,
            fieldHost,
          )}
        {showResults && (
          <WidgetArea label={text.results} theme="light" className={cx(themeStyles.theme, styles.area, styles.sheet, styles.column)}>
            {results}
          </WidgetArea>
        )}
      </>
    )
  }

  // Portrait sheet: the search bar is a pill like the navigation widget, the
  // results follow below it on the same sheet — full width.
  return (
    <WidgetArea
      label={label}
      theme="light"
      className={cx(themeStyles.theme, styles.area, styles.sheet, styles.top, !expanded && styles.folded)}
    >
      {/* One sheet in the toolbar colour that grows down from under the
          header: the search bar sits on top, the hits follow as cards. */}
      {scopeSwitch}
      <div className={styles.barRow}>
        <WidgetShell as="div" tone="search" className={styles.bar}>
          {head}
        </WidgetShell>
        {foldToggle}
      </div>
      {results}
    </WidgetArea>
  )
}
