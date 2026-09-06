import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public-client'
import { cache } from 'react'

/**
 * Canonical site URL. Falls back to the production domain when the env var
 * is not set (e.g. during local development without .env.local).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4wsinuajamii.org'

/** Default site identity used when the CMS hasn't configured a value. */
export const DEFAULT_SITE_NAME = "4W'S Inua Jamii Foundation"
export const DEFAULT_TAGLINE =
  'Where, Who, Why, What — Transforming Communities'
export const DEFAULT_DESCRIPTION =
  "Empowering communities through unity, service, and sustainable impact. Join 4W'S Inua Jamii Foundation in building a better tomorrow across Kenya."

/** Keys fetched from site_settings for SEO purposes. */
const SEO_KEYS = [
  'site_name',
  'tagline',
  'meta_description',
  'og_image_url',
  'twitter_url',
  'facebook_url',
  'instagram_url',
  'youtube_url',
  'linkedin_url',
  'tiktok_url',
  'contact_email',
  'contact_phone',
  'address',
  'logo_url',
  'google_site_verification',
  'bing_site_verification',
] as const

export interface SeoSettings {
  siteName: string
  tagline: string
  metaDescription: string
  ogImageUrl: string | null
  twitterUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
  linkedinUrl: string | null
  tiktokUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  logoUrl: string | null
  googleVerification: string | null
  bingVerification: string | null
}

/**
 * Fetch SEO-relevant settings from the CMS.
 * Memoised per-request via React `cache()` so multiple metadata / page
 * / structured-data calls in the same render share one DB round trip.
 */
export const fetchSeoSettings = cache(async (): Promise<SeoSettings> => {
  let map: Record<string, string> = {}

  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', SEO_KEYS)

    for (const row of data ?? []) {
      if (row.value != null) map[row.key] = row.value
    }
  } catch {
    // DB unavailable (e.g. during build without env vars) — use defaults.
  }

  const get = (k: string) => map[k] || null

  return {
    siteName: get('site_name') || DEFAULT_SITE_NAME,
    tagline: get('tagline') || DEFAULT_TAGLINE,
    metaDescription: get('meta_description') || DEFAULT_DESCRIPTION,
    ogImageUrl: get('og_image_url'),
    twitterUrl: get('twitter_url'),
    facebookUrl: get('facebook_url'),
    instagramUrl: get('instagram_url'),
    youtubeUrl: get('youtube_url'),
    linkedinUrl: get('linkedin_url'),
    tiktokUrl: get('tiktok_url'),
    contactEmail: get('contact_email'),
    contactPhone: get('contact_phone'),
    address: get('address'),
    logoUrl: get('logo_url'),
    googleVerification: get('google_site_verification'),
    bingVerification: get('bing_site_verification'),
  }
})

/**
 * Build the root-level Metadata object for `app/layout.tsx`.
 * Uses `generateMetadata` so CMS values are live.
 */
export async function buildRootMetadata(): Promise<Metadata> {
  const seo = await fetchSeoSettings()

  const ogImages = seo.ogImageUrl
    ? [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: seo.siteName }]
    : undefined

  const verification: Metadata['verification'] = {}
  if (seo.googleVerification) verification.google = seo.googleVerification
  if (seo.bingVerification) verification.other = { 'msvalidate.01': seo.bingVerification }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${seo.siteName} — ${seo.tagline}`,
      template: `%s | ${seo.siteName}`,
    },
    description: seo.metaDescription,
    keywords: [
      'foundation',
      'community',
      'Kenya',
      'social impact',
      'charity',
      'empowerment',
      'Nairobi',
      'volunteer',
      'non-profit',
      '4WS',
      'Inua Jamii',
    ],
    authors: [{ name: seo.siteName }],
    creator: seo.siteName,
    publisher: seo.siteName,
    alternates: {
      canonical: SITE_URL,
    },
    icons: {
      icon: [{ url: '/icon', sizes: '32x32', type: 'image/png' }],
      apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      locale: 'en_KE',
      url: SITE_URL,
      siteName: seo.siteName,
      title: `${seo.siteName} — ${seo.tagline}`,
      description: seo.metaDescription,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seo.siteName} — ${seo.tagline}`,
      description: seo.metaDescription,
      images: ogImages?.map((i) => i.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    verification,
  }
}

/**
 * Build per-page metadata with canonical URL, OG, and Twitter overrides.
 * Merges with the root template — only override what differs.
 */
export async function buildPageMetadata(opts: {
  title?: string
  description?: string
  path?: string // e.g. '/events' or '/events/123'
  image?: string | null
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  noIndex?: boolean
}): Promise<Metadata> {
  const seo = await fetchSeoSettings()
  const canonical = opts.path ? `${SITE_URL}${opts.path}` : undefined
  const image = opts.image ?? seo.ogImageUrl
  const ogImages = image
    ? [{ url: image, width: 1200, height: 630, alt: opts.title ?? seo.siteName }]
    : undefined

  return {
    title: opts.title,
    description: opts.description ?? seo.metaDescription,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: opts.type ?? 'website',
      url: canonical ?? SITE_URL,
      title: opts.title
        ? `${opts.title} | ${seo.siteName}`
        : `${seo.siteName} — ${seo.tagline}`,
      description: opts.description ?? seo.metaDescription,
      images: ogImages,
      ...(opts.type === 'article'
        ? {
            publishedTime: opts.publishedTime,
            modifiedTime: opts.modifiedTime,
            authors: opts.authors,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title
        ? `${opts.title} | ${seo.siteName}`
        : `${seo.siteName} — ${seo.tagline}`,
      description: opts.description ?? seo.metaDescription,
      images: ogImages?.map((i) => i.url),
    },
    ...(opts.noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}
