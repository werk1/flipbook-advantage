import { Metadata, Viewport } from 'next'
import { LandscapeQrOverlay } from '@/components/layout/LandscapeQrOverlay'
import './global.css'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
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
