import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import ImpactStats from '@/components/home/ImpactStats'
import ProgramsOverview from '@/components/home/ProgramsOverview'
import EventsPreview from '@/components/home/EventsPreview'
import CallToAction from '@/components/home/CallToAction'
import { createPublicClient } from '@/lib/supabase/public-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '4W\'S Inua Jamii Foundation — Empowering Communities Across Kenya',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createPublicClient()

  // Fetch site settings for hero and identity
  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'hero_title', 'hero_subtitle', 'hero_cta_label', 'hero_cta_url',
      'hero_badge_text', 'hero_image_url',
      'show_impact_stats', 'show_events_preview',
    ])

  const allSettings    = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value ?? '']))
  const heroSettings   = allSettings
  const showStats      = allSettings.show_impact_stats   !== 'false'
  const showEventsPreview = allSettings.show_events_preview !== 'false'

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

  // Fetch program images from DB (override hardcoded fallbacks)
  const { data: dbProgramImages } = await supabase
    .from('programs')
    .select('slug, image_url')
    .not('image_url', 'is', null)

  const programDbImages: Record<string, string> = {}
  for (const p of dbProgramImages ?? []) {
    if (p.slug && p.image_url) programDbImages[p.slug] = p.image_url
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero settings={heroSettings} />
        {showStats && <ImpactStats metrics={impactMetrics ?? []} />}
        <ProgramsOverview dbImages={programDbImages} />
        {showEventsPreview && <EventsPreview events={upcomingEvents ?? []} rsvpCounts={rsvpCountMap} />}
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}


