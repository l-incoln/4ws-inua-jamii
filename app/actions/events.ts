'use server'

import { createClient } from '@/lib/supabase/server'
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

  const { error } = await supabase
    .from('rsvps')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/dashboard/events')
  return { success: true }
}

