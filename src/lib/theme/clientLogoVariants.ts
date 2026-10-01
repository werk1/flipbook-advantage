/**
 * Client name and marks from Site Settings (group "Kunde"): the wide logo for the
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
  /** Client name: shown on top while no logo is set, alt text of the logo, text in the status bar. */
  name?: string
  /**
   * Word before the page number in the status bar: undefined uses the
   * language default ("Seite" / "Page"), an empty string shows numbers only.
   */
  pageWord?: string
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
