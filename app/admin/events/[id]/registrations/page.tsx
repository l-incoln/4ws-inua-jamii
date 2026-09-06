import { createClient } from '@/lib/supabase/server'
import AdminRegistrationsClient from '@/components/admin/AdminRegistrationsClient'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Event Registrations — Admin' }

type Props = { params: Promise<{ id: string }> }

export default async function AdminRegistrationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: event }, { data: registrations }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, max_attendees')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('event_registrations')
      .select('id, full_name, email, phone, field_data, status, source, external_completed, created_at')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!event) redirect('/admin/events')

  return (
    <div>
      <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <AdminRegistrationsClient
        eventId={id}
        eventTitle={event.title}
        registrations={registrations ?? []}
        maxAttendees={event.max_attendees ?? null}
      />
    </div>
  )
}
