import { Metadata, Viewport } from 'next'
import { LandscapeQrOverlay } from '@/components/layout/LandscapeQrOverlay'
import { getActiveColorScheme } from '@/lib/theme/appColorScheme'
import '@werk1/w1-system-widgets/styles.css'
import './global.css'
import './theme/palettes.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'flipbook-advantage',
  description: 'flipbook-advantage',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const scheme = await getActiveColorScheme()
  return (
    <html lang="de" data-color-scheme-id={scheme.id} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/api/app-fonts.css" />
        {/* Values are validated (colours/gradients only) before output. */}
        <style id="app-color-scheme" dangerouslySetInnerHTML={{ __html: scheme.css }} />
      </head>
      <body>
        <LandscapeQrOverlay />
        {children}
      </body>
    </html>
  )
}
