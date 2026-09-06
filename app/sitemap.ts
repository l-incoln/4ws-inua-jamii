import { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public-client'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4wsinuajamii.org'

// Sitemap fetches from the database at request time — never prerender at build.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages — always present regardless of DB availability.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/programs`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/stories`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/videos`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/impact`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/donate`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Fetch dynamic content in parallel — guard against build-time DB unavailability.
  let eventPages: MetadataRoute.Sitemap = []
  let postPages: MetadataRoute.Sitemap = []
  let programPages: MetadataRoute.Sitemap = []

  try {
    const supabase = createPublicClient()
    const [eventsResult, postsResult, programsResult] = await Promise.all([
      supabase
        .from('events')
        .select('id, updated_at, event_date')
        .in('status', ['upcoming', 'ongoing', 'completed'])
        .order('event_date', { ascending: false })
        .limit(100),
      supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100),
      supabase
        .from('programs')
        .select('slug, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(50),
    ])

    eventPages = (eventsResult.data ?? []).map((e) => ({
      url: `${BASE_URL}/events/${e.id}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    postPages = (postsResult.data ?? []).map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : (p.published_at ? new Date(p.published_at) : now),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    programPages = (programsResult.data ?? []).map((p) => ({
      url: `${BASE_URL}/programs/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable (e.g. during build) — return static pages only.
  }

  return [...staticPages, ...eventPages, ...postPages, ...programPages]
}
