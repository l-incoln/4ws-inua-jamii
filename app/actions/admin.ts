'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { MembershipTier } from '@/types'

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

export async function createMember(formData: FormData) {
  const { error: adminError } = await requireAdmin()
  if (adminError) return { error: adminError }

  const email    = (formData.get('email') as string)?.trim()
  const fullName = (formData.get('full_name') as string)?.trim()
  const phone    = (formData.get('phone') as string)?.trim() || null
  const tier     = (formData.get('tier') as string) || 'basic'
  const password = (formData.get('password') as string)?.trim()

  if (!email || !fullName || !password) return { error: 'Email, full name, and password are required' }

  // Use service-role client to create auth user
  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createError) return { error: createError.message }

  // Profile is auto-created by trigger, but update with extra fields
  if (created.user) {
    await admin
      .from('profiles')
      .update({ full_name: fullName, phone, tier })
      .eq('id', created.user.id)
  }

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
    // Site Info
    'site_name', 'tagline', 'about_mission', 'about_vision', 'logo_url', 'logo_size',
    // Contact & Socials
    'contact_email', 'contact_phone', 'address',
    'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url', 'linkedin_url',
    // Payments
    'mpesa_paybill', 'mpesa_account', 'bank_name', 'bank_account',
    'donation_currency', 'min_donation_amount', 'mpesa_shortcode_type',
    'donation_thank_you_message', 'donation_receipts_email',
    // SEO & Metadata
    'meta_description', 'og_image_url',
    'google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id',
    // Membership
    'membership_fee_basic', 'membership_fee_active', 'membership_fee_champion',
    'membership_currency', 'new_signups_enabled', 'auto_approve_members',
    // Email / Notifications
    'from_email', 'from_name', 'admin_notify_email',
    'welcome_email_enabled', 'welcome_email_body',
    // Homepage
    'show_events_preview', 'show_impact_stats',
    'hero_title', 'hero_subtitle', 'hero_cta_label', 'hero_cta_url',
    'hero_image_url', 'hero_badge_text',
    // Events & RSVP
    'rsvp_enabled', 'rsvp_require_login', 'event_reminder_days',
    // Legal / Footer
    'privacy_policy_url', 'terms_url', 'registration_number', 'footer_tagline',
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

  // Revalidate all public-facing pages so changes appear immediately
  revalidatePath('/', 'layout')
  revalidatePath('/about')
  revalidatePath('/blog')
  revalidatePath('/events')
  revalidatePath('/programs')
  revalidatePath('/contact')
  revalidatePath('/donate')
  revalidatePath('/admin/settings')
  return { success: true }
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
export async function uploadImage(formData: FormData, folder: string = 'general') {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) return { error: 'Only JPEG, PNG, WebP and GIF images are allowed' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be under 5MB' }

  const validFolders = ['team', 'programs', 'events', 'gallery', 'blog', 'documents', 'general']
  const safeFolder = validFolders.includes(folder) ? folder : 'general'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storagePath)

  // Register in media library (non-blocking)
  await supabase.from('media_assets').insert({
    url:          publicUrl,
    storage_path: storagePath,
    file_name:    file.name,
    file_size:    file.size,
    mime_type:    file.type,
    folder:       safeFolder,
    uploaded_by:  user.id,
  }).then(() => { /* fire-and-forget */ })

  return { url: publicUrl }
}

// ─── Site Image Upload (logo, hero, etc.) ─────────────────────────────────────
// Uploads an image to storage and saves the URL to site_settings under `settingKey`.
export async function uploadSiteImage(
  formData: FormData,
  settingKey: 'logo_url' | 'hero_image_url' | 'og_image_url',
) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) return { error: 'Only JPEG, PNG, WebP, GIF or SVG images are allowed' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be under 5 MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const storagePath = `site/${settingKey}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(storagePath, file, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storagePath)

  // Persist to site_settings
  const { error: dbError } = await supabase
    .from('site_settings')
    .upsert({ key: settingKey, value: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (dbError) return { error: dbError.message }

  // Revalidate everywhere the image appears
  revalidatePath('/', 'layout')
  revalidatePath('/admin/settings')
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

// ─── Contact Messages ─────────────────────────────────────────────────────────
export async function markContactMessageRead(messageId: string, isRead: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('contact_messages')
    .update({ is_read: isRead })
    .eq('id', messageId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/messages')
  return { success: true }
}

export async function deleteContactMessage(messageId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', messageId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/messages')
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

// ─── Bulk Member Actions ───────────────────────────────────────────────────────
export async function bulkUpdateMemberStatus(
  profileIds: string[],
  status: 'approved' | 'rejected' | 'pending'
) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }
  if (!profileIds.length) return { error: 'No members selected' }

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ membership_status: status })
    .in('id', profileIds)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/members')
  return { success: true, count: profileIds.length }
}

// ─── Document Management ──────────────────────────────────────────────────────
export async function saveDocument(formData: FormData, documentId?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const title       = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const file_url    = (formData.get('file_url') as string)?.trim()
  const file_name   = (formData.get('file_name') as string)?.trim() || null
  const category    = (formData.get('category') as string) || 'general'
  const version     = (formData.get('version') as string)?.trim() || null
  const is_public   = formData.get('is_public') !== 'false'

  if (!title) return { error: 'Title is required' }
  if (!file_url) return { error: 'File URL is required' }

  const payload = { title, description, file_url, file_name, category, version, is_public, uploaded_by: user.id }

  if (documentId) {
    const { uploaded_by: _ub, ...updatePayload } = payload
    const { error: dbError } = await supabase.from('documents').update(updatePayload).eq('id', documentId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase.from('documents').insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/documents')
  revalidatePath('/dashboard/resources')
  return { success: true }
}

export async function deleteDocument(documentId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase.from('documents').delete().eq('id', documentId)
  if (dbError) return { error: dbError.message }

  revalidatePath('/admin/documents')
  revalidatePath('/dashboard/resources')
  return { success: true }
}

export async function uploadDocument(formData: FormData) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Some browsers/OS send empty or octet-stream MIME for PDFs — fallback by extension
    'application/octet-stream',
    '',
  ]
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx']
  const typeOk = allowedTypes.includes(file.type) || allowedExts.includes(ext)
  if (!typeOk) return { error: 'Only PDF, Word, and Excel files are allowed' }
  if (file.size > 20 * 1024 * 1024) return { error: 'File must be under 20MB' }

  const filename = `documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || 'pdf'}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filename)
  return { url: publicUrl, name: file.name, size: file.size }
}

// ─── Donation Campaigns CRUD ──────────────────────────────────────────────────
export async function saveCampaign(formData: FormData, campaignId?: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const title       = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const goal        = parseFloat(formData.get('goal') as string)
  const image_url   = (formData.get('image_url') as string)?.trim() || null
  const deadline    = (formData.get('deadline') as string) || null
  const is_active   = formData.get('is_active') !== 'false'
  const slug        = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : ''

  if (!title) return { error: 'Title is required' }
  if (isNaN(goal) || goal <= 0) return { error: 'Goal must be a positive number' }

  const payload = { title, description, goal, image_url, deadline: deadline || null, is_active, slug }

  if (campaignId) {
    const { slug: _s, ...updatePayload } = payload
    const { error: dbError } = await supabase
      .from('donation_campaigns')
      .update(updatePayload)
      .eq('id', campaignId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('donation_campaigns')
      .insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/campaigns')
  revalidatePath('/donate')
  return { success: true }
}

export async function toggleCampaignStatus(campaignId: string, isActive: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('donation_campaigns')
    .update({ is_active: isActive })
    .eq('id', campaignId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/campaigns')
  revalidatePath('/donate')
  return { success: true }
}

export async function deleteCampaign(campaignId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('donation_campaigns')
    .delete()
    .eq('id', campaignId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/campaigns')
  revalidatePath('/donate')
  return { success: true }
}

// ─── Attendance Check-in ──────────────────────────────────────────────────────
export async function checkInAttendee(rsvpId: string, checkedIn: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('rsvps')
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq('id', rsvpId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/events')
  return { success: true }
}

// ─── Blog Comment Moderation ──────────────────────────────────────────────────
export async function approveComment(commentId: string, approved: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('blog_comments')
    .update({ is_approved: approved })
    .eq('id', commentId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/comments')
  revalidatePath('/blog')
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', commentId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/comments')
  revalidatePath('/blog')
  return { success: true }
}

// ─── Program Applications ─────────────────────────────────────────────────────
export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected' | 'pending',
  adminNote?: string
) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('program_applications')
    .update({ status, admin_note: adminNote ?? null })
    .eq('id', applicationId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/applications')
  return { success: true }
}

// ─── Volunteer Tasks ──────────────────────────────────────────────────────────
export async function saveVolunteerTask(formData: FormData, taskId?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const title           = (formData.get('title') as string)?.trim()
  const description     = (formData.get('description') as string)?.trim() || null
  const skills_raw      = (formData.get('skills_required') as string)?.trim() || ''
  const skills_required = skills_raw ? skills_raw.split(',').map((s) => s.trim()).filter(Boolean) : []
  const deadline        = (formData.get('deadline') as string) || null

  if (!title) return { error: 'Title is required' }

  const payload = { title, description, skills_required, deadline: deadline || null, created_by: user.id }

  if (taskId) {
    const { created_by: _cb, ...updatePayload } = payload
    const { error: dbError } = await supabase
      .from('volunteer_tasks')
      .update(updatePayload)
      .eq('id', taskId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('volunteer_tasks')
      .insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/admin/volunteers')
  revalidatePath('/dashboard/tasks')
  return { success: true }
}

export async function deleteVolunteerTask(taskId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('volunteer_tasks')
    .delete()
    .eq('id', taskId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/volunteers')
  revalidatePath('/dashboard/tasks')
  return { success: true }
}

export async function markTaskComplete(taskId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('volunteer_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/admin/volunteers')
  revalidatePath('/dashboard/tasks')
  return { success: true }
}

// ─── MEMBERSHIP IDENTITY ───────────────────────────────────────────────────────

export async function issueMembership(
  userId: string,
  tier: MembershipTier,
  months: number,
  notes?: string,
) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  // Deactivate any current active terms
  await supabase
    .from('membership_terms')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  const now = new Date()
  const validUntil = new Date(now)
  validUntil.setMonth(validUntil.getMonth() + months)

  const { data: term, error: termErr } = await supabase
    .from('membership_terms')
    .insert({
      user_id: userId,
      tier,
      issued_by: user.id,
      notes: notes ?? null,
      valid_from: now.toISOString().split('T')[0],
      valid_until: validUntil.toISOString().split('T')[0],
      is_active: true,
    })
    .select('id')
    .single()

  if (termErr || !term) return { error: termErr?.message ?? 'Failed to create term' }

  const { error: tokenErr } = await supabase
    .from('membership_tokens')
    .insert({ term_id: term.id, user_id: userId })

  if (tokenErr) return { error: tokenErr.message }

  await supabase
    .from('profiles')
    .update({ tier, membership_status: 'approved' })
    .eq('id', userId)

  revalidatePath('/admin/members')
  revalidatePath('/dashboard/membership-card')
  return { success: true }
}

// ─── Leadership Team CRUD ─────────────────────────────────────────────────────
export async function saveLeadershipMember(formData: FormData, memberId?: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const name       = (formData.get('name') as string)?.trim()
  const role       = (formData.get('role') as string)?.trim()
  const bio        = (formData.get('bio') as string)?.trim() || null
  const image_url  = (formData.get('image_url') as string)?.trim() || null
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active  = formData.get('is_active') !== 'false'

  if (!name || !role) return { error: 'Name and role are required' }

  const payload = { name, role, bio, image_url, sort_order, is_active }

  if (memberId) {
    const { error: dbError } = await supabase
      .from('leadership_team')
      .update(payload)
      .eq('id', memberId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('leadership_team')
      .insert(payload)
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/about')
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function deleteLeadershipMember(memberId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('leadership_team')
    .delete()
    .eq('id', memberId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/about')
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function renewMembership(termId: string, months: number) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const { data: term, error: fetchErr } = await supabase
    .from('membership_terms')
    .select('user_id, tier, valid_until')
    .eq('id', termId)
    .single()

  if (fetchErr || !term) return { error: 'Term not found' }

  await supabase
    .from('membership_terms')
    .update({ is_active: false })
    .eq('id', termId)

  const newFrom = new Date(term.valid_until)
  const newUntil = new Date(newFrom)
  newUntil.setMonth(newUntil.getMonth() + months)

  const { data: newTerm, error: termErr } = await supabase
    .from('membership_terms')
    .insert({
      user_id: term.user_id,
      tier: term.tier,
      issued_by: user.id,
      valid_from: newFrom.toISOString().split('T')[0],
      valid_until: newUntil.toISOString().split('T')[0],
      is_active: true,
    })
    .select('id')
    .single()

  if (termErr || !newTerm) return { error: termErr?.message ?? 'Failed to renew' }

  await supabase
    .from('membership_tokens')
    .insert({ term_id: newTerm.id, user_id: term.user_id })

  revalidatePath('/admin/members')
  revalidatePath('/dashboard/membership-card')
  return { success: true }
}

// ─── Gallery CRUD ──────────────────────────────────────────────────────────────
export async function saveGalleryItem(formData: FormData, itemId?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const title       = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const image_url   = (formData.get('image_url') as string)?.trim()
  const category    = (formData.get('category') as string)?.trim() || null
  const event_name  = (formData.get('event_name') as string)?.trim() || null
  const taken_at    = (formData.get('taken_at') as string) || null
  const sort_order  = parseInt(formData.get('sort_order') as string) || 0
  const is_active   = formData.get('is_active') !== 'false'

  if (!title) return { error: 'Title is required' }
  if (!image_url) return { error: 'Image is required' }

  const payload = { title, description, image_url, category, event_name, taken_at: taken_at || null, sort_order, is_active }

  if (itemId) {
    const { error: dbError } = await supabase
      .from('gallery_items')
      .update(payload)
      .eq('id', itemId)
    if (dbError) return { error: dbError.message }
  } else {
    const { error: dbError } = await supabase
      .from('gallery_items')
      .insert({ ...payload, created_by: user.id })
    if (dbError) return { error: dbError.message }
  }

  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
  return { success: true }
}

export async function deleteGalleryItem(itemId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', itemId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
  return { success: true }
}

export async function toggleGalleryItem(itemId: string, isActive: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbError } = await supabase
    .from('gallery_items')
    .update({ is_active: isActive })
    .eq('id', itemId)

  if (dbError) return { error: dbError.message }
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
  return { success: true }
}