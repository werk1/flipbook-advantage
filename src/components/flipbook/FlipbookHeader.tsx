'use client'

import { useEffect, useRef, useState } from 'react'
import type { FlipbookMenuItem } from '@/lib/blocks/flipbook/resolveFlipbookBlockInput'
import { flipbookLocaleQuery } from '@/lib/blocks/flipbook/locale'
import styles from './FlipbookHeader.module.css'

const MENU_LABEL = 'Flipbooks'

export function FlipbookHeader({
  items,
  activeSlug,
  locale,
  title,
}: {
  items: FlipbookMenuItem[]
  activeSlug?: string
  locale: string
  title: string
}) {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const localeQuery = flipbookLocaleQuery(locale)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header className={styles.header}>
      <a className={styles.brand} href={`/${localeQuery}`}>
        {title}
      </a>
      <nav className={styles.nav} ref={navRef}>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          {MENU_LABEL}
        </button>
        {open && (
          <ul className={styles.menu}>
            {items.map((item) => (
              <li key={item.slug}>
                <a
                  className={styles.menuItem}
                  href={`/?book=${encodeURIComponent(item.slug)}${flipbookLocaleQuery(locale, '&')}`}
                  aria-current={item.slug === activeSlug ? 'page' : undefined}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  )
}
