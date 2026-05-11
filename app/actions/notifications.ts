'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { NotificationType } from '@/types'

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  revalidatePath('/dashboard')
  return { success: true }
}

/** Admin: send a notification to all members or a specific user */
export async function sendNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId?: string    // if omitted, send to all approved members
  type: NotificationType
  title: string
  body?: string
  link?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (adminProfile?.role !== 'admin') return { error: 'Insufficient permissions' }

  if (userId) {
    await supabase.from('notifications').insert({ user_id: userId, type, title, body: body ?? null, link: link ?? null })
  } else {
    // Broadcast to all approved members
    const { data: members } = await supabase
      .from('profiles')
      .select('id')
      .eq('membership_status', 'approved')
    if (members && members.length > 0) {
      await supabase.from('notifications').insert(
        members.map((m) => ({ user_id: m.id, type, title, body: body ?? null, link: link ?? null }))
      )
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/** Send membership expiry reminder (called server-side, e.g. cron) */
export async function sendExpiryReminders() {
  const supabase = await createClient()

  // Find terms expiring in the next 7 days
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const { data: expiringTerms } = await supabase
    .from('membership_terms')
    .select('user_id, valid_until, tier')
    .eq('is_active', true)
    .lte('valid_until', sevenDaysFromNow.toISOString().split('T')[0])
    .gte('valid_until', new Date().toISOString().split('T')[0])

  if (!expiringTerms) return { sent: 0 }

  for (const term of expiringTerms) {
    await supabase.from('notifications').upsert({
      user_id: term.user_id,
      type: 'membership_expiry' as NotificationType,
      title: '⏰ Membership expiring soon',
      body: `Your membership expires on ${new Date(term.valid_until).toLocaleDateString('en-KE')}. Contact the foundation to renew.`,
      link: '/dashboard/membership-card',
    })
  }

  return { sent: expiringTerms.length }
}
