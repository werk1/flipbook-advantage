import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { searchScopesOf, searchSeries } from '@/lib/flipbook/seriesSearch'
import { isAdminRequest } from '@/lib/blocks/flipbook/viewerAccess'

export const runtime = 'nodejs'

/**
 * Public full-text search of a published flipbook (reader search).
 *
 * GET ?slug=<flipbook slug>&q=<query>[&scope=issue|all]
 *   → { hits: [{ pageIndex, snippet, rect?, marks?, document? }], scopes? }
 * `scope=all` also searches the other issues of the flipbook's series; their
 * hits carry a `document` (slug, title, link). An empty `q` answers 200
 * `{ hits: [], scopes }` for a searchable flipbook (`scopes` lists `all` when
 * it has other searchable issues) and 404 otherwise: the reader probes with
 * it to decide whether to show its search and the scope switch.
 *
 * Only published flipbooks are searchable and only hits (page, snippet, block
 * rect, rects of the matched words) leave the server — never the text model. A flipbook with
 * `defaultConfig.allowSearch` off answers 404 (as not searchable) to everyone
 * but admins.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim() ?? ''
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'slug is required.' } }, { status: 400 })
  }
  // A one-character query finds nothing useful; an empty one is the reader's availability probe.
  const effective = query.length < 2 ? '' : query
  const payload = await getPayload({ config: configPromise })
  try {
    const admin = await isAdminRequest(payload, request.headers)
    const scope = request.nextUrl.searchParams.get('scope') === 'all' ? 'all' : 'issue'
    const hits = await searchSeries(payload, slug, effective, scope, { admin })
    if (hits === null) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Flipbook not found.' } }, { status: 404 })
    // An admin answer may carry what the public one must not: never in a shared cache.
    const scopes = effective === '' ? await searchScopesOf(payload, slug, { admin }) : undefined
    return NextResponse.json(scopes ? { hits, scopes } : { hits }, { headers: { 'Cache-Control': admin ? 'private, no-store' : 'public, max-age=60' } })
  } catch (error) {
    payload.logger.error(`flipbook-search failed: ${String(error)}`)
    return NextResponse.json({ error: { code: 'FAILED', message: 'Search failed.' } }, { status: 500 })
  }
}
