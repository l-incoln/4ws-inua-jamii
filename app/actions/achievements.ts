'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BadgeType } from '@/types'
import { BADGE_META } from '@/lib/badge-meta'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, user: null, error: 'Unauthorized' as string }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Insufficient permissions' as string }
  return { supabase, user, error: null }
}

export async function awardBadge(userId: string, badgeType: BadgeType, notes?: string) {
  const { supabase, user, error } = await requireAdmin()
  if (error || !supabase || !user) return { error }

  const { error: dbErr } = await supabase
    .from('member_badges')
    .upsert({ user_id: userId, badge_type: badgeType, awarded_by: user.id, notes: notes ?? null }, {
      onConflict: 'user_id,badge_type',
      ignoreDuplicates: false,
    })

  if (dbErr) return { error: dbErr.message }

  // Send a notification to the member
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'badge_awarded',
    title: `🏅 New badge: ${BADGE_META[badgeType]?.label ?? badgeType}`,
    body: notes ?? `You've earned the ${BADGE_META[badgeType]?.label ?? badgeType} badge!`,
    link: '/dashboard/achievements',
  })

  revalidatePath('/admin/members')
  revalidatePath('/dashboard/achievements')
  return { success: true }
}

export async function revokeBadge(userId: string, badgeType: BadgeType) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: dbErr } = await supabase
    .from('member_badges')
    .delete()
    .eq('user_id', userId)
    .eq('badge_type', badgeType)

  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/members')
  revalidatePath('/dashboard/achievements')
  return { success: true }
}
