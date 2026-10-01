import ClientLayout from '@/components/client-layout/ClientLayout'
import { FlipbookReader } from '@/components/flipbook/FlipbookReader'
import { resolveFlipbookLocale } from '@/lib/blocks/flipbook/locale'
import { coverUrlOf, loadPublishedFlipbook, mapFlipbookToInput } from '@/lib/blocks/flipbook/resolveFlipbookBlockInput'
import { getClientLogo } from '@/lib/theme/clientLogo'
import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

type FlipbookReaderPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string; page?: string }>
}

export const dynamic = 'force-dynamic'


function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

async function loadFlipbook(slug: string, locale: string) {
  const payload = await getPayload({ config: configPromise })
  const doc = await loadPublishedFlipbook(payload, slug, locale)
  return { doc, input: mapFlipbookToInput(doc) }
}

export async function generateMetadata({ params, searchParams }: FlipbookReaderPageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = resolveFlipbookLocale((await searchParams).locale)
  const { doc, input } = await loadFlipbook(slug, locale).catch(() => ({ doc: null, input: null }))
  if (!input) return { title: 'Flipbook' }

  const cover = coverUrlOf(doc) ?? input.pages[0]?.imageUrl
  return {
    title: input.title ?? input.slug,
    openGraph: {
      title: input.title ?? input.slug,
      images: cover ? [{ url: new URL(cover, baseUrl()).toString() }] : undefined,
    },
  }
}

export default async function FlipbookReaderPage({ params, searchParams }: FlipbookReaderPageProps) {
  const { slug } = await params
  const query = await searchParams
  const locale = resolveFlipbookLocale(query.locale)
  const payload = await getPayload({ config: configPromise })
  const doc = await loadPublishedFlipbook(payload, slug, locale)
  const input = mapFlipbookToInput(doc)
  if (!input) notFound()
  const clientLogo = await getClientLogo()

  const requested = Number(query.page)
  const valid = Number.isInteger(requested) && requested >= 1 && requested <= input.pages.length
  const startPage = valid ? requested - 1 : (input.config?.startPage ?? 0)

  return (
    <ClientLayout renderBeforeDeviceReady>
      {/* Canonical deep link and embed link (Payload Admin, Flipbooks
          collection): no header, no menu — only the flipbook. Title
          and client marks only feed the phone-landscape side bar. */}
      <FlipbookReader
        input={{ ...input, config: { ...input.config, startPage } }}
        locale={locale}
        siteTitle={input.title}
        clientLogo={clientLogo}
      />
    </ClientLayout>
  )
}
