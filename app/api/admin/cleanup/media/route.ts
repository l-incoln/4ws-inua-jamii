import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/cleanup/media
 *
 * Finds media_assets whose URL is not referenced in any content table,
 * removes them from Supabase Storage and deletes the DB rows.
 *
 * Returns JSON: { deleted: number, urls: string[] }
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Gather all URLs currently referenced across content tables
  const [programs, events, blogs, campaigns, profiles, documents] = await Promise.all([
    supabase.from('programs').select('image_url').not('image_url', 'is', null),
    supabase.from('events').select('image_url').not('image_url', 'is', null),
    supabase.from('blog_posts').select('image_url').not('image_url', 'is', null),
    supabase.from('donation_campaigns').select('image_url').not('image_url', 'is', null),
    supabase.from('profiles').select('avatar_url').not('avatar_url', 'is', null),
    supabase.from('documents').select('file_url').not('file_url', 'is', null),
  ])

  const usedUrls = new Set<string>([
    ...(programs.data  ?? []).map((r: { image_url: string }) => r.image_url),
    ...(events.data    ?? []).map((r: { image_url: string }) => r.image_url),
    ...(blogs.data     ?? []).map((r: { image_url: string }) => r.image_url),
    ...(campaigns.data ?? []).map((r: { image_url: string }) => r.image_url),
    ...(profiles.data  ?? []).map((r: { avatar_url: string }) => r.avatar_url),
    ...(documents.data ?? []).map((r: { file_url: string }) => r.file_url),
  ].filter(Boolean))

  const { data: allAssets } = await supabase
    .from('media_assets')
    .select('id, url, storage_path, file_name')

  if (!allAssets?.length) {
    return NextResponse.redirect(new URL('/admin/media?cleaned=0', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  }

  type AssetRow = { id: string; url: string; storage_path: string; file_name: string }
  const orphaned = (allAssets as AssetRow[]).filter((a) => !usedUrls.has(a.url))

  if (!orphaned.length) {
    return NextResponse.redirect(new URL('/admin/media?cleaned=0', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  }

  // Delete from Supabase Storage
  const storagePaths = orphaned.map((a) => a.storage_path).filter(Boolean)
  if (storagePaths.length) {
    await supabase.storage.from('uploads').remove(storagePaths)
  }

  // Delete from media_assets table
  const ids = orphaned.map((a) => a.id)
  await supabase.from('media_assets').delete().in('id', ids)

  return NextResponse.redirect(
    new URL(`/admin/media?cleaned=${orphaned.length}`, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  )
}
