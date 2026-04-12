import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import ImpactStats from '@/components/home/ImpactStats'
import ProgramsOverview from '@/components/home/ProgramsOverview'
import EventsPreview from '@/components/home/EventsPreview'
import CallToAction from '@/components/home/CallToAction'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '4W\'S Inua Jamii Foundation — Empowering Communities Across Kenya',
}

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch real upcoming events for the homepage preview
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, description, location, event_date, start_time, image_url, category, max_attendees, status')
    .in('status', ['upcoming', 'ongoing'])
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(3)

  // Fetch RSVP counts for those events
  const eventIds = (upcomingEvents ?? []).map((e) => e.id)
  const { data: rsvpCounts } = eventIds.length > 0
    ? await supabase
        .from('rsvps')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'confirmed')
    : { data: [] }

  const rsvpCountMap: Record<string, number> = {}
  for (const r of (rsvpCounts ?? [])) {
    rsvpCountMap[r.event_id] = (rsvpCountMap[r.event_id] ?? 0) + 1
  }

  // Fetch live impact metrics for ImpactStats
  const { data: impactMetrics } = await supabase
    .from('impact_metrics')
    .select('id, label, value, unit, icon')
    .order('sort_order', { ascending: true })

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ImpactStats metrics={impactMetrics ?? []} />
        <ProgramsOverview />
        <EventsPreview events={upcomingEvents ?? []} rsvpCounts={rsvpCountMap} />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}


