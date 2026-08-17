'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail, escapeHtml, emailLayout, emailButton, SITE_URL, ORG_NAME } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function rsvpForEvent(eventId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to RSVP.' }
  }

  // Check capacity
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees')
    .eq('id', eventId)
    .single()

  if (event?.max_attendees) {
    const { count } = await supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (count !== null && count >= event.max_attendees) {
      // Add to waitlist instead
      const { error } = await supabase.from('rsvps').upsert(
        { event_id: eventId, user_id: user.id, status: 'waitlisted' },
        { onConflict: 'event_id,user_id' }
      )
      if (error) return { error: error.message }
      revalidatePath(`/events/${eventId}`)
      revalidatePath('/dashboard/events')
      return { success: true }
    }
  }

  const { error } = await supabase.from('rsvps').upsert(
    { event_id: eventId, user_id: user.id, status: 'confirmed' },
    { onConflict: 'event_id,user_id' }
  )

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function cancelRsvp(eventId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in.' }
  }

  // Cancel this user's RSVP
  const { error } = await supabase
    .from('rsvps')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Auto-promote the next waitlisted person if the event has a capacity limit
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees, title')
    .eq('id', eventId)
    .single()

  if (event?.max_attendees) {
    const { count } = await supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (count !== null && count < event.max_attendees) {
      // Find the earliest waitlisted RSVP
      const { data: nextWaitlisted } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'waitlisted')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextWaitlisted) {
        // Promote to confirmed
        await supabase
          .from('rsvps')
          .update({ status: 'confirmed' })
          .eq('event_id', eventId)
          .eq('user_id', nextWaitlisted.user_id)

        // Notify the promoted user in-app
        await supabase.from('notifications').insert({
          user_id: nextWaitlisted.user_id,
          type: 'general',
          title: 'You\'re in! Spot confirmed',
          body: `A spot opened up for "${event.title}" and you've been promoted from the waitlist. See you there!`,
          link: `/events/${eventId}`,
        }).then(() => {})

        // Send email notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', nextWaitlisted.user_id)
          .single()

        if (profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: `You're in! Spot confirmed for "${event.title}"`,
            html: eventPromotionHtml(profile.full_name ?? 'Member', event.title, eventId),
            template: 'event_waitlist_promotion',
          }).catch(() => {})
        }
      }
    }
  }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/dashboard/events')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Event reminder — called by cron to send reminders for upcoming events
// ---------------------------------------------------------------------------
export async function sendEventReminders() {
  const supabase = await createClient()

  // Read the reminder days setting (default: 2 days before)
  const { data: setting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'event_reminder_days')
    .single()
  const reminderDays = setting?.value ? parseInt(setting.value, 10) : 2
  if (!Number.isFinite(reminderDays) || reminderDays < 0) return { sent: 0 }

  // Find events happening within the next `reminderDays` days
  const now = new Date()
  const target = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000)
  const targetDateStr = target.toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]

  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_date, location')
    .gte('start_date', todayStr)
    .lte('start_date', targetDateStr)
    .neq('status', 'cancelled')

  if (!events || events.length === 0) return { sent: 0 }

  let sent = 0
  for (const event of events) {
    // Find all confirmed RSVPs for this event
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', event.id)
      .eq('status', 'confirmed')

    if (!rsvps || rsvps.length === 0) continue

    // Fetch profiles for all RSVPs
    const userIds = rsvps.map((r) => r.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    for (const profile of profiles ?? []) {
      // Check if we already sent a reminder for this event+user
      // (use a notification as the dedup marker)
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', 'general')
        .like('body', `%event_reminder:${event.id}%`)
        .limit(1)
        .maybeSingle()

      if (existing) continue // already reminded

      // Insert in-app notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'general',
        title: `Event reminder: ${event.title}`,
        body: `This is a reminder that "${event.title}" is coming up on ${new Date(event.start_date).toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}.${event.location ? ` Location: ${event.location}.` : ''} event_reminder:${event.id}`,
        link: `/events/${event.id}`,
      })

      // Send email reminder
      if (profile.email) {
        await sendEmail({
          to: profile.email,
          subject: `Reminder: ${event.title} is coming up!`,
          html: eventReminderHtml(
            profile.full_name ?? 'Member',
            event.title,
            new Date(event.start_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            event.location ?? null,
            event.id
          ),
          template: 'event_reminder',
        }).catch(() => {})
        sent++
      }
    }
  }

  return { sent }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------
function eventPromotionHtml(name: string, eventTitle: string, eventId: string) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Great news! A spot opened up for <strong>&ldquo;${escapeHtml(eventTitle)}&rdquo;</strong> and you&apos;ve been
      promoted from the waitlist to a confirmed attendee.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      We look forward to seeing you at the event!
    </p>
    ${emailButton('View Event Details', `${SITE_URL}/events/${eventId}`, '#1E3A8A')}
  `
  return emailLayout({
    headerTitle:    'You\'re In! Spot Confirmed',
    headerSubtitle: 'You were promoted from the waitlist.',
    headerColor:    '#16a34a',
    body,
  })
}

function eventReminderHtml(name: string, eventTitle: string, dateStr: string, location: string | null, eventId: string) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      This is a friendly reminder that you&apos;re registered for
      <strong>&ldquo;${escapeHtml(eventTitle)}&rdquo;</strong>.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #1E3A8A;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Event:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(eventTitle)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Date:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(dateStr)}</td></tr>
        ${location ? `<tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Location:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(location)}</td></tr>` : ''}
      </table>
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:20px;">
      If you can no longer attend, please cancel your RSVP from your dashboard so a waitlisted member can take your spot.
    </p>
    ${emailButton('View Event Details', `${SITE_URL}/events/${eventId}`, '#1E3A8A')}
  `
  return emailLayout({
    headerTitle:    'Event Reminder',
    headerSubtitle: `Upcoming: ${eventTitle}`,
    headerColor:    '#1E3A8A',
    body,
  })
}

