import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AttendanceClient from '@/components/admin/AttendanceClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('title').eq('id', id).single()
  return { title: `Attendance: ${data?.title ?? 'Event'} | Admin` }
}

export default async function EventAttendeesPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, event_date, start_time, location, max_attendees')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: rawRsvps } = await supabase
    .from('rsvps')
    .select(`
      id, status, checked_in, checked_in_at, created_at,
      profiles ( id, full_name, email, phone, avatar_url )
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  const rsvps = (rawRsvps ?? []).map((r) => ({
    ...r,
    profiles: Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : r.profiles,
  }))

  return <AttendanceClient event={event} rsvps={rsvps} />
}
