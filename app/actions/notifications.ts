'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail, membershipExpiryReminderHtml } from '@/lib/email'
import { getEmailSettings, senderFor } from '@/lib/email-settings'
import type { NotificationType } from '@/types'

// ---------------------------------------------------------------------------
// Internal helper – insert a notification for a single user.
// Used by auth.ts and admin.ts so dashboard notifications always stay in sync
// with email sends. Never throws — failures are logged only.
// ---------------------------------------------------------------------------
export async function insertNotification({
  supabase,
  userId,
  type,
  title,
  body,
  link,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body:  body  ?? null,
      link:  link  ?? null,
      read:  false,
    })
  } catch (err) {
    console.error('[notifications] insertNotification failed:', err)
  }
}

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

  // Fetch profile details (name, email) for all expiring members in one query
  const userIds = expiringTerms.map((t) => t.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Expiry reminders are member-relations communication → sent from membership@
  // (member relations), reply-to membership@.
  const settings = await getEmailSettings(supabase)
  const membership = senderFor(settings, 'membership')

  let sent = 0
  for (const term of expiringTerms) {
    // Insert in-app notification
    await supabase.from('notifications').upsert({
      user_id: term.user_id,
      type: 'membership_expiry' as NotificationType,
      title: '⏰ Membership expiring soon',
      body: `Your membership expires on ${new Date(term.valid_until).toLocaleDateString('en-KE')}. Contact the foundation to renew.`,
      link: '/dashboard/membership-card',
    })

    // Send email reminder
    const profile = profileMap.get(term.user_id)
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        from: membership.from,
        replyTo: membership.replyTo,
        subject: 'Your 4W\'S Inua Jamii membership is expiring soon',
        html: membershipExpiryReminderHtml({
          name: profile.full_name ?? 'Member',
          expiryDate: new Date(term.valid_until).toLocaleDateString('en-KE', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
          tier: term.tier ?? 'basic',
          contactEmail: settings.roles.membership.address,
        }),
      }).catch(() => {})
      sent++
    }
  }

  return { sent }
}
