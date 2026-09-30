'use client'

import { useState } from 'react'
import { useField } from '@payloadcms/ui'
import { defaultLanguage, languageLabels, supportedLanguages } from '@/config/languages'

/**
 * Read-only public reader URLs of this flipbook, shown above the title.
 * The reader at /flipbooks/[slug] renders without header and menu, so the
 * link can be copied and embedded on other websites. One row per supported
 * language; non-default languages carry ?locale=<code>.
 */
export function FlipbookPublicLink() {
  const { value: slug } = useField<string>({ path: 'slug' })
  const [copied, setCopied] = useState<string | null>(null)

  const origin =
    (typeof window !== 'undefined' && window.location.origin) ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    ''

  const urlFor = (code: string) =>
    slug ? `${origin}/flipbooks/${encodeURIComponent(slug)}${code === defaultLanguage ? '' : `?locale=${code}`}` : null

  const copy = async (url: string, code: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Link kopieren:', url)
      return
    }
    setCopied(code)
    setTimeout(() => setCopied((v) => (v === code ? null : v)), 1500)
  }

  return (
    <div className="field-type" style={{ marginBottom: '0.5rem' }}>
      <label className="field-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
        Öffentlicher Link (ohne Kopfzeile und Menü)
      </label>
      {slug ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {supportedLanguages.map((code) => {
            const url = urlFor(code)
            return (
              <div key={code} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: '5rem', fontSize: '0.8rem', color: 'var(--theme-elevation-500, #888)' }}>
                  {languageLabels[code] ?? code}
                </span>
                <input
                  type="text"
                  readOnly
                  value={url ?? ''}
                  onFocus={(e) => e.currentTarget.select()}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    border: '1px solid var(--theme-elevation-150, #ccc)',
                    borderRadius: '4px',
                    background: 'var(--theme-elevation-50, #f7f7f7)',
                  }}
                />
                <button
                  type="button"
                  className="btn btn--style-secondary btn--size-small"
                  onClick={() => url && void copy(url, code)}
                >
                  {copied === code ? 'Kopiert' : 'Kopieren'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ margin: 0, color: 'var(--theme-elevation-500, #888)', fontSize: '0.85rem' }}>
          Der Link entsteht, sobald ein Slug gespeichert ist.
        </p>
      )}
    </div>
  )
}
