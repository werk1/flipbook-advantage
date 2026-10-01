import { getPayloadClient } from '@/lib/payload/getPayloadClient'
import type { ClientLogo, ClientLogoImage } from './clientLogoVariants'

type MediaDoc = { url?: string | null; width?: number | null; height?: number | null }

function toImage(value: unknown): ClientLogoImage | undefined {
  if (!value || typeof value !== 'object') return undefined
  const media = value as MediaDoc
  if (!media.url) return undefined
  return { url: media.url, width: media.width ?? undefined, height: media.height ?? undefined }
}

/**
 * The client logo and pictogram chosen in Site Settings (group "Kundenlogo"),
 * or undefined when none is set or the database is unavailable; the reader
 * then shows the name and its initial instead. Server only.
 */
export async function getClientLogo(): Promise<ClientLogo | undefined> {
  try {
    const payload = await getPayloadClient()
    const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 1 })) as {
      clientLogo?: Record<keyof ClientLogo, unknown> | null
    }
    const logo: ClientLogo = {
      positive: toImage(settings.clientLogo?.positive),
      negative: toImage(settings.clientLogo?.negative),
      pictogramPositive: toImage(settings.clientLogo?.pictogramPositive),
      pictogramNegative: toImage(settings.clientLogo?.pictogramNegative),
    }
    return Object.values(logo).some(Boolean) ? logo : undefined
  } catch {
    return undefined
  }
}
