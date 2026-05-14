import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import EventsGrid from '@/components/events/EventsGrid'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public-client'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Join 4W\'S Inua Jamii Foundation events and be part of the change.',
}

export default async function EventsPage() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('events')
    .select('id, title, description, event_date, start_time, end_time, location, image_url, category, status, max_attendees')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('event_date', { ascending: true })

  const events = data ?? []

  // Count confirmed RSVPs per event
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

  const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[]

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
            <EventsGrid events={events} rsvpCounts={rsvpCounts} categories={categories} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
