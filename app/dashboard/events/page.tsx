import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, MapPin, ArrowRight, PlusCircle, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Events' }

const statusBadge: Record<string, string> = {
  confirmed: 'bg-primary-100 text-primary-700',
  waitlisted: 'bg-sky-100 text-sky-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabel: Record<string, string> = {
  confirmed: '✓ Confirmed',
  waitlisted: '⏳ Waitlisted',
  cancelled: 'Cancelled',
}

export default async function MyEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  // Fetch ALL user RSVPs with event data, then filter in JS
  // (PostgREST doesn't support filtering on related-table columns via .gte/.lt on joined tables)
  const { data: allRsvps } = await supabase
    .from('rsvps')
    .select(`
      id, status,
      event:events (
        id, title, location, event_date, start_time, image_url, category
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Filter in JS: upcoming = confirmed/waitlisted for future events
  const upcoming = (allRsvps ?? []).filter((r) => {
    const ev = r.event as unknown as { event_date: string } | null
    return ev && ['confirmed', 'waitlisted'].includes(r.status) && ev.event_date >= today
  })

  // past = confirmed events that already passed
  const past = (allRsvps ?? []).filter((r) => {
    const ev = r.event as unknown as { event_date: string } | null
    return ev && r.status === 'confirmed' && ev.event_date < today
  }).slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Events</h1>
          <p className="text-slate-500 text-sm mt-1">Events you&apos;ve RSVPed for and attended.</p>
        </div>
        <Link href="/events" className="btn-primary text-sm">
          <PlusCircle className="w-4 h-4" />
          Browse Events
        </Link>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="card p-10 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No upcoming events yet.</p>
            <Link href="/events" className="btn-primary mt-4 inline-flex text-sm">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((rsvp) => {
              const event = rsvp.event as unknown as {
                id: string; title: string; location: string
                event_date: string; start_time: string | null; image_url: string | null; category: string | null
              }
              return (
                <div key={rsvp.id} className="card flex items-center gap-4 p-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {event.image_url && (
                      <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {event.category && <span className="badge-green text-xs">{event.category}</span>}
                      <span className={`badge text-xs ${statusBadge[rsvp.status] ?? ''}`}>
                        {statusLabel[rsvp.status] ?? rsvp.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.event_date).toLocaleDateString('en-KE', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {event.start_time && (
                          <><Clock className="w-3 h-3 ml-1" /> {event.start_time}</>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:gap-1.5 transition-all flex-shrink-0"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past events */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Past Events ({past.length})</h2>
          <div className="space-y-4">
            {past.map((rsvp) => {
              const event = rsvp.event as unknown as {
                id: string; title: string; location: string
                event_date: string; image_url: string | null; category: string | null
              }
              return (
                <div key={rsvp.id} className="card flex items-center gap-4 p-4 opacity-75">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 grayscale bg-gray-100">
                    {event.image_url && (
                      <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-700">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {new Date(event.event_date).toLocaleDateString('en-KE', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      <span className="badge bg-primary-100 text-primary-700 text-xs">Attended</span>
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:gap-1.5 transition-all flex-shrink-0"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


