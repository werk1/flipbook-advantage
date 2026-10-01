import { getPayloadClient } from '@/lib/payload/getPayloadClient'

/**
 * App color palettes (see `src/app/(frontend)/theme/palettes.css`). Chosen in
 * the admin (Site Settings → Farbschema) and set as `data-app-palette` on
 * `<html>`; light or dark follows `prefers-color-scheme`.
 */
export const APP_PALETTES = ['graphite', 'advantage', 'sage'] as const
export type AppPalette = (typeof APP_PALETTES)[number]

export const DEFAULT_APP_PALETTE: AppPalette = 'graphite'

export function resolveAppPalette(value: unknown): AppPalette {
  return APP_PALETTES.includes(value as AppPalette) ? (value as AppPalette) : DEFAULT_APP_PALETTE
}

/** Reads the palette from Site Settings; falls back to the default when unavailable. */
export async function getAppPalette(): Promise<AppPalette> {
  try {
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return resolveAppPalette((settings as { colorPalette?: unknown }).colorPalette)
  } catch {
    return DEFAULT_APP_PALETTE
  }
}
