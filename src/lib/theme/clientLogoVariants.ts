/**
 * Client marks from Site Settings (group "Kundenlogo"): the wide logo for the
 * header and the square pictogram for the slim phone-landscape bar. Positive
 * variants are for light, negative ones for dark surfaces. Pure types and
 * helpers, safe for client components (the loader is in clientLogo.ts).
 */

export interface ClientLogoImage {
  url: string
  width?: number
  height?: number
}

export interface ClientLogo {
  positive?: ClientLogoImage
  negative?: ClientLogoImage
  pictogramPositive?: ClientLogoImage
  pictogramNegative?: ClientLogoImage
}

/**
 * One variant alone serves both modes; with both, dark surfaces get the
 * negative one (`prefers-color-scheme: dark`).
 */
export function pickLogoVariants(
  positive: ClientLogoImage | undefined,
  negative: ClientLogoImage | undefined,
): { main?: ClientLogoImage; dark?: ClientLogoImage } {
  return { main: positive ?? negative, dark: positive && negative ? negative : undefined }
}
