import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import EventsGrid from '@/components/events/EventsGrid'
import PageBackLink from '@/components/layout/PageBackLink'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public-client'
import { getEventPartnerSettings, getEventPartnersForEvents } from '@/lib/event-partners-settings'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Events',
    description: "Join 4W'S Inua Jamii Foundation events — community drives, outreach activities, workshops, and volunteer opportunities across Kenya.",
    path: '/events',
  })
}

export default async function EventsPage() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('events')
    .select('id, title, description, event_date, start_time, end_time, location, image_url, category, status, max_attendees')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('event_date', { ascending: true })
    .limit(60)

  const events = data ?? []

  // Fetch RSVP counts and event partner settings concurrently.
  const [rsvpsResult, partnerSettings] = await Promise.all([
    events.length > 0
      ? supabase
          .from('rsvps')
          .select('event_id')
          .in('event_id', events.map((e) => e.id))
          .eq('status', 'confirmed')
      : Promise.resolve({ data: null, error: null, count: null, status: 0, statusText: '' }),
    getEventPartnerSettings(supabase),
  ])

  // Count confirmed RSVPs per event
  const rsvpCounts: Record<string, number> = {}
  if (rsvpsResult.data) {
    for (const r of rsvpsResult.data) {
      rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1
    }
  }

  // Fetch event sponsors for the listing (bulk query)
  let eventSponsors: Record<string, { id: string; name: string; logo_url: string | null; website_url: string | null; contribution: string | null }[]> = {}
  if (partnerSettings.showEventPartnersListing && events.length > 0) {
    try {
      eventSponsors = await getEventPartnersForEvents(supabase, events.map((e) => e.id))
    } catch { /* table doesn't exist yet */ }
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
            <PageBackLink href="/" label="Back to Home" className="mb-6" />
            <EventsGrid
              events={events}
              rsvpCounts={rsvpCounts}
              categories={categories}
              eventSponsors={eventSponsors}
              sponsorsLabel={partnerSettings.eventPartnersListingLabel}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
