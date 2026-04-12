'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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

// ─── Member Management ─────────────────────────────────────────────────────────
export async function updateMemberStatus(profileId: string, status: 'approved' | 'rejected' | 'pending') {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ membership_status: status })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/members')
  return { success: true }
}

export async function updateMemberTier(profileId: string, tier: 'basic' | 'active' | 'champion') {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ tier })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/members')
  return { success: true }
}

export async function updateMemberRole(profileId: string, role: 'member' | 'volunteer' | 'admin') {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/members')
  return { success: true }
}

// ─── Blog Post CRUD ────────────────────────────────────────────────────────────
const blogSchema = z.object({
  title:       z.string().min(3, 'Title is required'),
  slug:        z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens'),
  excerpt:     z.string().optional(),
  body:        z.string().optional(),
  category:    z.string().optional(),
  tags:        z.string().optional(), // comma-separated
  image_url:   z.string().url('Invalid image URL').optional().or(z.literal('')),
  status:      z.enum(['draft', 'published', 'scheduled']),
  read_time:   z.string().optional(),
})

export async function saveBlogPost(formData: FormData, postId?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const raw = {
    title:     formData.get('title') as string,
    slug:      formData.get('slug') as string,
    excerpt:   formData.get('excerpt') as string || undefined,
    body:      formData.get('body') as string || undefined,
    category:  formData.get('category') as string || undefined,
    tags:      formData.get('tags') as string || undefined,
    image_url: formData.get('image_url') as string || undefined,
    status:    (formData.get('status') as string || 'draft') as 'draft' | 'published' | 'scheduled',
    read_time: formData.get('read_time') as string || undefined,
  }

  const parsed = blogSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const tagsArray = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const payload = {
    title:        parsed.data.title,
    slug:         parsed.data.slug,
    excerpt:      parsed.data.excerpt || null,
    body:         parsed.data.body || null,
    category:     parsed.data.category || null,
    tags:         tagsArray,
    image_url:    parsed.data.image_url || null,
    status:       parsed.data.status,
    read_time:    parsed.data.read_time || null,
    author_id:    user.id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  }

  if (postId) {
    const { error: dbError } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', postId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('blog_posts')
      .insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/content')
  revalidatePath('/blog')
  redirect('/admin/content')
}

export async function deleteBlogPost(postId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', postId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/content')
  revalidatePath('/blog')
  return { success: true }
}

export async function togglePostStatus(postId: string, currentStatus: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const newStatus = currentStatus === 'published' ? 'draft' : 'published'
  const { error: dbError } = await supabase
    .from('blog_posts')
    .update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', postId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/content')
  revalidatePath('/blog')
  return { success: true }
}

// ─── Announcements CRUD ────────────────────────────────────────────────────────
export async function saveAnnouncement(formData: FormData, announcementId?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const title = (formData.get('title') as string)?.trim()
  const body  = (formData.get('body') as string)?.trim() || null
  const isPinned = formData.get('is_pinned') === 'true'

  if (!title) return { error: 'Title is required' }

  const payload = { title, body, is_pinned: isPinned, created_by: user.id }

  if (announcementId) {
    const { title: t, body: b, is_pinned: ip } = payload
    const { error: dbError } = await supabase
      .from('announcements')
      .update({ title: t, body: b, is_pinned: ip })
      .eq('id', announcementId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('announcements')
      .insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard/feed')
  return { success: true }
}

export async function deleteAnnouncement(announcementId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard/feed')
  return { success: true }
}

// ─── Events CRUD ───────────────────────────────────────────────────────────────
export async function saveEvent(formData: FormData, eventId?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const title        = (formData.get('title') as string)?.trim()
  const description  = (formData.get('description') as string)?.trim() || null
  const location     = (formData.get('location') as string)?.trim()
  const event_date   = formData.get('event_date') as string
  const start_time   = (formData.get('start_time') as string) || null
  const end_time     = (formData.get('end_time') as string) || null
  const image_url    = (formData.get('image_url') as string) || null
  const category     = (formData.get('category') as string) || null
  const max_attendees = formData.get('max_attendees') ? Number(formData.get('max_attendees')) : null
  const status       = (formData.get('status') as string) || 'upcoming'

  if (!title || !location || !event_date) {
    return { error: 'Title, location, and date are required' }
  }

  const payload = {
    title, description, location, event_date, start_time, end_time,
    image_url, category, max_attendees, status,
    created_by: user.id,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  }

  if (eventId) {
    const { slug: _s, created_by: _c, ...updatePayload } = payload
    const { error: dbError } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('events')
      .insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

// ─── Site Settings ─────────────────────────────────────────────────────────────
export async function saveSiteSettings(formData: FormData) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const keys = [
    'site_name', 'tagline', 'contact_email', 'contact_phone', 'address',
    'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url', 'linkedin_url',
    'mpesa_paybill', 'mpesa_account', 'bank_name', 'bank_account',
    'about_mission', 'about_vision',
  ]

  const upserts = keys.map((key) => ({
    key,
    value: (formData.get(key) as string) || '',
    updated_at: new Date().toISOString(),
  }))

  const { error: dbError } = await supabase
    .from('site_settings')
    .upsert(upserts, { onConflict: 'key' })

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/settings')
  return { success: true }
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
export async function uploadImage(formData: FormData, folder: string = 'uploads') {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) return { error: 'Only JPEG, PNG, WebP and GIF images are allowed' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be under 5MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filename)
  return { url: publicUrl }
}

// ─── Impact Metrics ────────────────────────────────────────────────────────────
export async function saveImpactMetric(formData: FormData, metricId?: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const label      = (formData.get('label') as string)?.trim()
  const value      = Number(formData.get('value'))
  const unit       = (formData.get('unit') as string) || ''
  const sort_order = Number(formData.get('sort_order')) || 0

  if (!label || isNaN(value)) return { error: 'Label and value are required' }

  if (metricId) {
    const { error: dbError } = await supabase
      .from('impact_metrics')
      .update({ label, value, unit, sort_order })
      .eq('id', metricId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('impact_metrics')
      .insert({ label, value, unit, sort_order })
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/')
  return { success: true }
}

// ─── Programs ─────────────────────────────────────────────────────────────────
const ProgramSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().min(10, 'Description is required'),
  icon: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  beneficiary_count: z.coerce.number().int().min(0).optional(),
  is_active: z.coerce.boolean().optional(),
})

export async function saveProgram(formData: FormData, programId?: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const raw = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    icon: formData.get('icon') || undefined,
    image_url: formData.get('image_url') || undefined,
    beneficiary_count: formData.get('beneficiary_count') || undefined,
    is_active: formData.get('is_active') === 'true',
  }

  const parsed = ProgramSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const payload = {
    ...parsed.data,
    image_url: parsed.data.image_url || null,
    icon: parsed.data.icon || null,
  }

  if (programId) {
    const { error: dbError } = await supabase.from('programs').update(payload).eq('id', programId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase.from('programs').insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/content')
  revalidatePath('/programs')
  return { success: true }
}

export async function deleteProgram(programId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase.from('programs').delete().eq('id', programId)
  if (dbError) return { error: dbError.message }

  revalidatePath('/admin/content')
  revalidatePath('/programs')
  return { success: true }
}

export async function toggleProgramStatus(programId: string, isActive: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('programs')
    .update({ is_active: isActive })
    .eq('id', programId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/content')
  revalidatePath('/programs')
  return { success: true }
}

// ─── Donation Status Management ───────────────────────────────────────────────
export async function updateDonationStatus(
  donationId: string,
  status: 'completed' | 'failed' | 'refunded'
) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('donations')
    .update({ status })
    .eq('id', donationId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/donations')
  return { success: true }
}

