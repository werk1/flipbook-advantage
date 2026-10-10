'use client'

import { useEffect, useState } from 'react'
import type { W1FlipbookSearch } from '@werk1/w1-system-flipbook/types'

type Hit = Awaited<ReturnType<W1FlipbookSearch['search']>>[number]

const endpoint = (slug: string, query: string, scope?: string) =>
  `/api/flipbook-search?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(query)}${scope ? `&scope=${encodeURIComponent(scope)}` : ''}`

/** Search adapter of the reader: asks `/api/flipbook-search` (server-side full-text search). */
function createFlipbookSearch(slug: string, scopes: string[]): W1FlipbookSearch {
  return {
    // Only a flipbook with a series offers `all` besides its own issue.
    ...(scopes.length > 1 ? { scopes } : {}),
    search: async (query, signal, scope) => {
      const response = await fetch(endpoint(slug, query, scope), { signal })
      if (!response.ok) throw new Error(`Search failed (${response.status})`)
      const data = (await response.json()) as { hits?: Hit[] }
      return Array.isArray(data.hits) ? data.hits : []
    },
  }
}

/**
 * Search for a published flipbook, or `undefined` while unknown or when the
 * host cannot search it. The endpoint only exists in hosts with the pdfedit
 * module (it needs the extracted text), and answers an empty query with 200
 * only for flipbooks that have text — so one probe per slug decides whether
 * the viewer shows its search button.
 */
export function useFlipbookSearch(slug: string): W1FlipbookSearch | undefined {
  const [found, setFound] = useState<{ slug: string; search: W1FlipbookSearch } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(endpoint(slug, ''), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return setFound(null)
        const data = (await response.json().catch(() => ({}))) as { scopes?: unknown }
        const scopes = Array.isArray(data.scopes) ? data.scopes.filter((scope): scope is string => scope === 'issue' || scope === 'all') : []
        setFound({ slug, search: createFlipbookSearch(slug, scopes) })
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [slug])
  return found?.slug === slug ? found.search : undefined
}
