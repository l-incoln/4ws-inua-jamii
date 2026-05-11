'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Auth guard ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, user: null, error: 'Unauthorized' as string }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Insufficient permissions' as string }
  return { supabase, user, error: null }
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const MEDIA_FOLDERS = ['general', 'team', 'programs', 'events', 'gallery', 'blog', 'documents'] as const
export type MediaFolder = typeof MEDIA_FOLDERS[number]

const MAX_IMAGE_BYTES = 2 * 1024 * 1024   // 2 MB — client compresses before upload
const MAX_DOC_BYTES   = 20 * 1024 * 1024  // 20 MB

// Strict allow-list: only compressed web formats + PDF
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_DOC_TYPES   = ['application/pdf']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeFilename(name: string): string {
  const lastDot = name.lastIndexOf('.')
  const base    = lastDot > 0 ? name.slice(0, lastDot) : name
  const ext     = lastDot > 0 ? name.slice(lastDot + 1).toLowerCase() : 'bin'
  const safe    = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50)
  return `${safe || 'file'}.${ext}`
}

function parseTags(raw: string): string[] {
  return raw.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0 && t.length <= 30)
}

// ─── Upload ────────────────────────────────────────────────────────────────────
// FormData keys: file, thumb_file?, folder, alt_text, title, description, tags
export async function uploadMediaAsset(formData: FormData) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error: error ?? 'Unauthorized' }

  const file      = formData.get('file')       as File | null
  const thumbFile = formData.get('thumb_file') as File | null
  const folder    = (formData.get('folder')      as string) || 'general'
  const alt_text  = (formData.get('alt_text')    as string) || ''
  const title     = (formData.get('title')       as string) || ''
  const desc      = (formData.get('description') as string) || ''
  const tagsRaw   = (formData.get('tags')        as string) || ''

  if (!file || file.size === 0) return { error: 'No file provided' }

  const isImg = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isDoc = ALLOWED_DOC_TYPES.includes(file.type)

  if (!isImg && !isDoc) {
    return { error: 'Only JPG, PNG, WebP images and PDF documents are allowed' }
  }
  if (isImg && file.size > MAX_IMAGE_BYTES) {
    return { error: 'Image must be under 2 MB — images are auto-compressed on upload' }
  }
  if (isDoc && file.size > MAX_DOC_BYTES) {
    return { error: 'Document must be under 20 MB' }
  }

  const safeFolder  = MEDIA_FOLDERS.includes(folder as MediaFolder) ? folder : 'general'
  const cleanName   = sanitizeFilename(file.name)
  const ts          = Date.now()
  const rand        = Math.random().toString(36).slice(2, 8)
  const storagePath = `${safeFolder}/${ts}-${rand}-${cleanName}`

  const { error: upErr } = await supabase.storage
    .from('uploads')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storagePath)

  // Upload thumbnail variant if provided
  let thumbUrl: string | null = null
  if (thumbFile && thumbFile.size > 0) {
    const thumbPath = `${safeFolder}/thumbs/${ts}-${rand}-thumb-${cleanName}`
    const { error: thumbErr } = await supabase.storage
      .from('uploads')
      .upload(thumbPath, thumbFile, { contentType: thumbFile.type, upsert: false })
    if (!thumbErr) {
      thumbUrl = supabase.storage.from('uploads').getPublicUrl(thumbPath).data.publicUrl
    }
  }

  const tags = parseTags(tagsRaw)

  const { data: asset, error: dbErr } = await supabase
    .from('media_assets')
    .insert({
      url:          publicUrl,
      storage_path: storagePath,
      file_name:    cleanName,
      file_size:    file.size,
      mime_type:    file.type,
      file_type:    isImg ? 'image' : 'document',
      alt_text:     alt_text || null,
      title:        title    || null,
      description:  desc     || null,
      tags,
      folder:       safeFolder,
      uploaded_by:  user.id,
      thumb_url:    thumbUrl,
    })
    .select()
    .single()

  if (dbErr) {
    return { url: publicUrl, storagePath, warning: dbErr.message }
  }

  revalidatePath('/admin/media')
  return { url: publicUrl, storagePath, asset }
}

// ─── Update metadata ──────────────────────────────────────────────────────────
export async function updateMediaAsset(
  id: string,
  updates: {
    alt_text?:    string
    title?:       string
    description?: string
    folder?:      string
    tags?:        string[]
  },
) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const safeFolder = updates.folder
    ? (MEDIA_FOLDERS.includes(updates.folder as MediaFolder) ? updates.folder : 'general')
    : undefined

  const patch: Record<string, unknown> = {}
  if (updates.alt_text    !== undefined) patch.alt_text    = updates.alt_text || null
  if (updates.title       !== undefined) patch.title       = updates.title || null
  if (updates.description !== undefined) patch.description = updates.description || null
  if (safeFolder          !== undefined) patch.folder      = safeFolder
  if (updates.tags        !== undefined) patch.tags        = updates.tags

  const { error: dbErr } = await supabase.from('media_assets').update(patch).eq('id', id)
  if (dbErr) return { error: dbErr.message }

  revalidatePath('/admin/media')
  return { success: true }
}

// ─── Usage lookup ─────────────────────────────────────────────────────────────
export type AssetUsage = { type: string; label: string; id: string }

export async function getAssetUsage(assetId: string): Promise<{ usages: AssetUsage[]; error?: string }> {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { usages: [], error: error ?? 'Unauthorized' }

  const { data: asset } = await supabase
    .from('media_assets')
    .select('url')
    .eq('id', assetId)
    .single()

  if (!asset) return { usages: [], error: 'Asset not found' }

  const url = asset.url as string

  const [programs, events, blogs, campaigns, profiles, documents] = await Promise.all([
    supabase.from('programs').select('id, title').eq('image_url', url),
    supabase.from('events').select('id, title').eq('image_url', url),
    supabase.from('blog_posts').select('id, title').eq('image_url', url),
    supabase.from('donation_campaigns').select('id, title').eq('image_url', url),
    supabase.from('profiles').select('id, full_name').eq('avatar_url', url),
    supabase.from('documents').select('id, title').eq('file_url', url),
  ])

  const usages: AssetUsage[] = [
    ...(programs.data  ?? []).map((r: { id: string; title: string })     => ({ type: 'Program',   label: r.title,     id: r.id })),
    ...(events.data    ?? []).map((r: { id: string; title: string })     => ({ type: 'Event',     label: r.title,     id: r.id })),
    ...(blogs.data     ?? []).map((r: { id: string; title: string })     => ({ type: 'Blog Post', label: r.title,     id: r.id })),
    ...(campaigns.data ?? []).map((r: { id: string; title: string })     => ({ type: 'Campaign',  label: r.title,     id: r.id })),
    ...(profiles.data  ?? []).map((r: { id: string; full_name: string }) => ({ type: 'Profile',   label: r.full_name, id: r.id })),
    ...(documents.data ?? []).map((r: { id: string; title: string })     => ({ type: 'Document',  label: r.title,     id: r.id })),
  ]

  return { usages }
}

// ─── Delete single ─────────────────────────────────────────────────────────────
export async function deleteMediaAsset(id: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { data: asset } = await supabase
    .from('media_assets')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (asset?.storage_path) {
    await supabase.storage.from('uploads').remove([asset.storage_path])
  }

  const { error: dbErr } = await supabase.from('media_assets').delete().eq('id', id)
  if (dbErr) return { error: dbErr.message }

  revalidatePath('/admin/media')
  return { success: true }
}

// ─── Bulk delete ──────────────────────────────────────────────────────────────
export async function bulkDeleteMediaAssets(ids: string[]) {
  if (!ids.length) return { success: true, deleted: 0 }
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { data: assets } = await supabase
    .from('media_assets')
    .select('storage_path')
    .in('id', ids)

  const paths = (assets ?? []).map((a: { storage_path: string }) => a.storage_path).filter(Boolean)
  if (paths.length) await supabase.storage.from('uploads').remove(paths)

  const { error: dbErr } = await supabase.from('media_assets').delete().in('id', ids)
  if (dbErr) return { error: dbErr.message }

  revalidatePath('/admin/media')
  return { success: true, deleted: ids.length }
}

// ─── Cleanup orphaned media ────────────────────────────────────────────────────
export async function cleanupOrphanedMedia() {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

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
    .select('id, url, storage_path')

  if (!allAssets?.length) return { deleted: 0 }

  const orphaned = (allAssets as { id: string; url: string; storage_path: string }[])
    .filter((a) => !usedUrls.has(a.url))

  if (!orphaned.length) return { deleted: 0 }

  const paths = orphaned.map((a) => a.storage_path).filter(Boolean)
  if (paths.length) await supabase.storage.from('uploads').remove(paths)

  await supabase.from('media_assets').delete().in('id', orphaned.map((a) => a.id))

  revalidatePath('/admin/media')
  return { deleted: orphaned.length }
}

// ─── Paginated list ────────────────────────────────────────────────────────────
export async function listMediaAssets({
  folder   = 'all',
  fileType = 'all',
  page     = 1,
  q        = '',
  tag      = '',
  limit    = 20,
}: {
  folder?:   string
  fileType?: string
  page?:     number
  q?:        string
  tag?:      string
  limit?:    number
}) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error, items: [], total: 0 }

  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('media_assets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (folder   && folder   !== 'all') query = query.eq('folder',    folder)
  if (fileType && fileType !== 'all') query = query.eq('file_type', fileType)
  if (q)   query = query.or(`file_name.ilike.%${q}%,title.ilike.%${q}%`)
  if (tag) query = query.contains('tags', [tag])

  const { data, count, error: dbErr } = await query
  if (dbErr) return { error: dbErr.message, items: [], total: 0 }

  return { items: data ?? [], total: count ?? 0 }
}