import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Calendar, MapPin, Users, ArrowRight, Filter } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Join 4W\'S Inua Jamii Foundation events and be part of the change.',
}

const categoryColors: Record<string, string> = {
  Health: 'badge-red',
  Economic: 'badge-sky',
  Environment: 'badge-green',
  Education: 'bg-sky-100 text-sky-800 badge',
  Empowerment: 'bg-purple-100 text-purple-800 badge',
  Fundraiser: 'bg-indigo-100 text-indigo-800 badge',
}

export default async function EventsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('events')
    .select('id, title, description, event_date, start_time, end_time, location, image_url, category, status, max_attendees')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('event_date', { ascending: true })

  const events = data ?? []
  const upcoming = events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
  const completed = events.filter((e) => e.status === 'completed')

  // Count confirmed RSVPs per event for progress bars
  let rsvpCounts: Record<string, number> = {}
  if (events.length > 0) {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('event_id')
      .in('event_id', events.map((e) => e.id))
      .eq('status', 'confirmed')
    if (rsvps) {
      for (const r of rsvps) {
        rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1
      }
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              Events
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Join the <span className="text-sky-400">Movement</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              Be part of events that transform lives and build stronger communities.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filter bar */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
                <p className="text-slate-500 text-sm mt-1">{upcoming.length} events coming up</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-600 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Upcoming events */}
            {upcoming.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No upcoming events right now.</p>
                <p className="text-sm mt-1">Check back soon for new events!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {upcoming.map((event) => {
                  const attendees = rsvpCounts[event.id] || 0
                  const capacity = event.max_attendees || 0
                  const pct = capacity > 0 ? Math.min((attendees / capacity) * 100, 100) : 0
                  const timeStr = event.start_time
                    ? event.end_time ? `${event.start_time} - ${event.end_time}` : event.start_time
                    : ''
                  return (
                    <article key={event.id} className="card group bg-white">
                      <div className="relative h-48 overflow-hidden">
                        {event.image_url ? (
                          <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-primary-300" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className={categoryColors[event.category || ''] || 'badge-gray'}>
                            {event.category || 'Event'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 bg-white/95 rounded-xl px-3 py-1.5 text-center shadow">
                          <div className="text-xs font-bold text-primary-600 uppercase leading-none">
                            {new Date(event.event_date).toLocaleString('en-KE', { month: 'short' })}
                          </div>
                          <div className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                            {new Date(event.event_date).getDate()}
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>

                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-primary-500" />
                            {new Date(event.event_date).toLocaleDateString('en-KE', {
                              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                            })}{timeStr ? ` · ${timeStr}` : ''}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-primary-500" />
                            {event.location}
                          </div>
                          {capacity > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Users className="w-3.5 h-3.5 text-primary-500" />
                              {attendees} / {capacity} registered
                            </div>
                          )}
                        </div>

                        {/* Progress bar */}
                        {capacity > 0 && (
                          <div className="mt-4">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {capacity - attendees} spots remaining
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-sm font-semibold text-primary-600 flex items-center gap-1 hover:gap-2 transition-all"
                          >
                            Details <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/events/${event.id}`}
                            className="px-4 py-2 rounded-full bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                          >
                            RSVP Now
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Past events */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completed.map((event) => {
                    const attendees = rsvpCounts[event.id] || 0
                    return (
                      <article key={event.id} className="card group opacity-80">
                        <div className="relative h-40 overflow-hidden grayscale">
                          {event.image_url ? (
                            <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Calendar className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30" />
                          <span className="absolute top-3 left-3 badge bg-gray-100 text-gray-700">
                            Completed
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-slate-700">{event.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.event_date).toLocaleDateString('en-KE', {
                              month: 'long', day: 'numeric', year: 'numeric',
                            })}
                          </div>
                          {attendees > 0 && (
                            <div className="text-xs text-slate-400 mt-1">
                              {attendees} attended
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

