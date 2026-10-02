import { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { LandscapeQrOverlay } from '@/components/layout/LandscapeQrOverlay'
import { UmamiTracker } from '@/components/umami-tracker/UmamiTracker'
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

const UMAMI_WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? 'f22e68e8-da0a-4db4-9158-05208f1e4f89'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const scheme = await getActiveColorScheme()
  return (
    <html lang="de" data-color-scheme-id={scheme.id} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/api/app-fonts.css" />
        {/* Values are validated (colours/gradients only) before output. */}
        <style id="app-color-scheme" dangerouslySetInnerHTML={{ __html: scheme.css }} />
        <Script
          src="https://umami.werk1.at/script.js"
          data-website-id={UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </head>
      <body>
        <LandscapeQrOverlay />
        <UmamiTracker />
        {children}
      </body>
    </html>
  )
}
