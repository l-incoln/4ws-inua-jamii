import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import RegistrationForm from '@/components/events/RegistrationForm'
import { createPublicClient } from '@/lib/supabase/public-client'
import { createClient } from '@/lib/supabase/server'
import { Calendar, MapPin, Clock, ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

async function getEvent(id: string): Promise<any> {
  const supabase = createPublicClient()
  // Try with new registration columns; fall back if migration not applied
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, location, event_date, start_time, end_time, image_url, category, max_attendees, status, rsvp_mode, external_rsvp_url, external_rsvp_label, rsvp_deadline, requires_login')
    .eq('id', id)
    .maybeSingle()

  if (error && error.message?.includes('column')) {
    const { data: fallback } = await supabase
      .from('events')
      .select('id, title, description, location, event_date, start_time, end_time, image_url, category, max_attendees, status')
      .eq('id', id)
      .maybeSingle()
    return fallback
  }

  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return { title: 'Event Not Found' }
  return { title: `Register — ${event.title}` }
}

export default async function RegisterPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  // External-only mode: redirect to the external form
  if (event.rsvp_mode === 'external' && event.external_rsvp_url) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
            <p className="text-slate-500">
              Registration for this event is handled through an external form.
            </p>
            <a
              href={event.external_rsvp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base inline-flex"
            >
              {event.external_rsvp_label || 'Register on External Form'}
              <ExternalLink className="w-5 h-5" />
            </a>
            <div>
              <Link href={`/events/${id}`} className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to event
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // RSVP disabled
  if (event.rsvp_mode === 'none') {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
            <p className="text-slate-500">Registration is not available for this event.</p>
            <Link href={`/events/${id}`} className="btn-secondary text-sm inline-flex">
              <ArrowLeft className="w-4 h-4" /> Back to event
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Check deadline
  const deadlinePassed = event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()

  // Fetch custom form fields (table may not exist if migration not applied)
  const publicClient = createPublicClient()
  let formFields: any[] = []
  try {
    const { data: ffData, error: ffErr } = await publicClient
      .from('event_form_fields')
      .select('id, field_name, field_label, field_type, field_options, is_required, sort_order')
      .eq('event_id', id)
      .order('sort_order', { ascending: true })
    if (!ffErr && ffData) formFields = ffData
  } catch { /* table doesn't exist yet */ }

  // Check if user is logged in (for prefill + login requirement)
  const serverSupabase = await createClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  let prefillName = ''
  let prefillEmail = ''
  if (user) {
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle()
    prefillName = profile?.full_name || user.user_metadata?.full_name || ''
    prefillEmail = profile?.email || user.email || ''
  }

  // Count current registrations (table may not exist yet)
  let regCount: number | null = 0
  try {
    const { count, error: rcErr } = await publicClient
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .neq('status', 'cancelled')
    if (!rcErr) regCount = count
  } catch { /* table doesn't exist yet */ }

  const isFull = event.max_attendees && event.max_attendees > 0 && (regCount ?? 0) >= event.max_attendees

  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date TBC'

  return (
    <>
      <Navbar />
      <main className="pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back link */}
          <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to event
          </Link>

          {/* Event summary */}
          <div className="mb-8">
            <span className="badge bg-primary-100 text-primary-800 mb-3 inline-block">{event.category}</span>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {eventDate}</span>
              {event.start_time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {event.start_time}</span>}
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
            </div>
          </div>

          {/* Deadline passed */}
          {deadlinePassed ? (
            <div className="card p-8 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Registration Closed</h3>
              <p className="text-slate-500 text-sm">The registration deadline for this event has passed.</p>
            </div>
          ) : isFull ? (
            <div className="card p-8 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Event Full</h3>
              <p className="text-slate-500 text-sm">This event has reached its maximum capacity.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Register for this event</h2>
              <RegistrationForm
                eventId={id}
                fields={formFields ?? []}
                rsvpMode={event.rsvp_mode}
                externalUrl={event.external_rsvp_url}
                externalLabel={event.external_rsvp_label || 'Register on External Form'}
                requiresLogin={event.requires_login ?? false}
                isLoggedIn={!!user}
                prefillName={prefillName}
                prefillEmail={prefillEmail}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
