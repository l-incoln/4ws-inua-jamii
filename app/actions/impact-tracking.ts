'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, user: null, error: 'Unauthorized' as string }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Insufficient permissions' as string }
  return { supabase, user, error: null }
}

// ── Distribution Records ──────────────────────────────────────────

const distributionSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['food', 'clothing', 'materials', 'medical', 'educational', 'other']),
  quantity: z.coerce.number().int().min(0),
  unit: z.string().min(1).max(50).default('items'),
  beneficiaries: z.coerce.number().int().min(0).default(0),
  location: z.string().max(200).optional(),
  distribution_date: z.string().min(1, 'Date is required'),
  program_id: z.string().uuid().optional().or(z.literal('')).optional(),
})

export async function saveDistributionRecord(id: string | null, formData: FormData) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const raw = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    category: formData.get('category') as string,
    quantity: formData.get('quantity') as string,
    unit: (formData.get('unit') as string) || 'items',
    beneficiaries: (formData.get('beneficiaries') as string) || '0',
    location: (formData.get('location') as string) || undefined,
    distribution_date: formData.get('distribution_date') as string,
    program_id: (formData.get('program_id') as string) || undefined,
  }

  const parsed = distributionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const data = {
    ...parsed.data,
    program_id: parsed.data.program_id || null,
    description: parsed.data.description || null,
    location: parsed.data.location || null,
  }

  if (id) {
    const { error: dbErr } = await supabase.from('distribution_records').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (dbErr) return { error: dbErr.message }
  } else {
    const { error: dbErr } = await supabase.from('distribution_records').insert({ ...data, created_by: user.id })
    if (dbErr) return { error: dbErr.message }
  }

  revalidatePath('/admin/distributions')
  revalidatePath('/impact')
  return { success: true }
}

export async function deleteDistributionRecord(id: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }
  const { error: dbErr } = await supabase.from('distribution_records').delete().eq('id', id)
  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/distributions')
  revalidatePath('/impact')
  return { success: true }
}

// ── Outreach Activities ───────────────────────────────────────────

const outreachSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  activity_type: z.enum(['community_visit', 'health_camp', 'education_drive', 'environmental', 'fundraiser', 'awareness_campaign', 'other']),
  location: z.string().max(200).optional(),
  participants: z.coerce.number().int().min(0).default(0),
  beneficiaries: z.coerce.number().int().min(0).default(0),
  activity_date: z.string().min(1, 'Date is required'),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('completed'),
  image_url: z.string().url().optional().or(z.literal('')).optional(),
  program_id: z.string().uuid().optional().or(z.literal('')).optional(),
})

export async function saveOutreachActivity(id: string | null, formData: FormData) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const raw = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    activity_type: formData.get('activity_type') as string,
    location: (formData.get('location') as string) || undefined,
    participants: (formData.get('participants') as string) || '0',
    beneficiaries: (formData.get('beneficiaries') as string) || '0',
    activity_date: formData.get('activity_date') as string,
    status: (formData.get('status') as string) || 'completed',
    image_url: (formData.get('image_url') as string) || undefined,
    program_id: (formData.get('program_id') as string) || undefined,
  }

  const parsed = outreachSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const data = {
    ...parsed.data,
    program_id: parsed.data.program_id || null,
    description: parsed.data.description || null,
    location: parsed.data.location || null,
    image_url: parsed.data.image_url || null,
  }

  if (id) {
    const { error: dbErr } = await supabase.from('outreach_activities').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (dbErr) return { error: dbErr.message }
  } else {
    const { error: dbErr } = await supabase.from('outreach_activities').insert({ ...data, created_by: user.id })
    if (dbErr) return { error: dbErr.message }
  }

  revalidatePath('/admin/outreach')
  revalidatePath('/impact')
  return { success: true }
}

export async function deleteOutreachActivity(id: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }
  const { error: dbErr } = await supabase.from('outreach_activities').delete().eq('id', id)
  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/outreach')
  revalidatePath('/impact')
  return { success: true }
}
