import { Metadata, Viewport } from 'next'
import { LandscapeQrOverlay } from '@/components/layout/LandscapeQrOverlay'
import { getAppPalette } from '@/lib/theme/appPalette'
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
  const palette = await getAppPalette()
  return (
    <html lang="de" data-app-palette={palette} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/api/app-fonts.css" />
      </head>
      <body>
        <LandscapeQrOverlay />
        {children}
      </body>
    </html>
  )
}
