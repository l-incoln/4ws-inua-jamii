'use server'

import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  id: string
  type: 'blog' | 'event' | 'program' | 'member' | 'gallery'
  title: string
  excerpt: string | null
  href: string
  image?: string | null
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const q = query.trim()
  const ilike = `%${q}%`

  const [blogRes, eventRes, programRes, memberRes, galleryRes] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image_url')
      .ilike('title', ilike)
      .eq('status', 'published')
      .limit(5),
    supabase
      .from('events')
      .select('id, title, description, location, cover_image_url')
      .ilike('title', ilike)
      .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
      .limit(5),
    supabase
      .from('programs')
      .select('id, title, slug, description')
      .ilike('title', ilike)
      .limit(5),
    supabase
      .from('profiles')
      .select('id, full_name, email, location')
      .or(`full_name.ilike.${ilike},email.ilike.${ilike}`)
      .eq('membership_status', 'approved')
      .limit(3),
    supabase
      .from('gallery_items')
      .select('id, title, image_url')
      .ilike('title', ilike)
      .eq('is_active', true)
      .limit(4),
  ])

  const results: SearchResult[] = [
    ...(blogRes.data ?? []).map((b) => ({
      id: b.id,
      type: 'blog' as const,
      title: b.title,
      excerpt: b.excerpt,
      href: `/blog/${b.slug}`,
      image: b.cover_image_url,
    })),
    ...(eventRes.data ?? []).map((e) => ({
      id: e.id,
      type: 'event' as const,
      title: e.title,
      excerpt: e.description ?? e.location,
      href: `/events/${e.id}`,
      image: e.cover_image_url,
    })),
    ...(programRes.data ?? []).map((p) => ({
      id: p.id,
      type: 'program' as const,
      title: p.title,
      excerpt: p.description,
      href: `/programs/${p.slug}`,
      image: null,
    })),
    ...(memberRes.data ?? []).map((m) => ({
      id: m.id,
      type: 'member' as const,
      title: m.full_name ?? m.email,
      excerpt: m.location,
      href: `/members/${m.id}`,
      image: null,
    })),
    ...(galleryRes.data ?? []).map((g) => ({
      id: g.id,
      type: 'gallery' as const,
      title: g.title,
      excerpt: null,
      href: '/gallery',
      image: g.image_url,
    })),
  ]

  return results
}
