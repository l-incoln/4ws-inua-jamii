import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import ImpactStats from '@/components/home/ImpactStats'
import ProgramsOverview from '@/components/home/ProgramsOverview'
import EventsPreview from '@/components/home/EventsPreview'
import CallToAction from '@/components/home/CallToAction'
import PartnersSection from '@/components/home/PartnersSection'
import AwarenessBanner from '@/components/awareness/AwarenessBanner'
import { createPublicClient } from '@/lib/supabase/public-client'
import { getAwarenessDaysForDate, filterByMinPriority } from '@/lib/awareness'
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
      'show_partners_section', 'partners_section_title',
      'show_awareness_banner', 'awareness_min_priority',
    ])

  const allSettings    = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value ?? '']))
  const heroSettings   = allSettings
  const showStats      = allSettings.show_impact_stats   !== 'false'
  const showEventsPreview = allSettings.show_events_preview !== 'false'
  const showPartners   = allSettings.show_partners_section !== 'false'
  const showBanner     = allSettings.show_awareness_banner !== 'false'
  const minPriority    = (allSettings.awareness_min_priority as 'high' | 'medium' | 'low') || 'medium'

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

  // Fetch today's awareness days for homepage banner
  const { data: allAwarenessDays } = showBanner
    ? await supabase
        .from('awareness_days')
        .select('id, name, description, month, day, specific_date, category, priority, icon_emoji, theme_color, banner_message, link_url, link_label, is_active')
        .eq('is_active', true)
    : { data: [] }
  const todaysDays = filterByMinPriority(
    getAwarenessDaysForDate(allAwarenessDays ?? [], new Date()),
    minPriority,
  )

  // Fetch active partners for homepage strip
  const { data: partners } = showPartners
    ? await supabase
        .from('partners')
        .select('id, name, logo_url, website_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    : { data: [] }

  return (
    <>
      <Navbar />
      <main>
        <Hero settings={heroSettings} />
        {showBanner && <AwarenessBanner days={todaysDays} />}
        {showStats && <ImpactStats metrics={impactMetrics ?? []} />}
        <ProgramsOverview dbImages={programDbImages} />
        {showEventsPreview && <EventsPreview events={upcomingEvents ?? []} rsvpCounts={rsvpCountMap} />}
        {showPartners && (partners ?? []).length > 0 && (
          <PartnersSection
            partners={(partners ?? []) as { id: string; name: string; logo_url: string | null; website_url: string | null }[]}
            title={allSettings.partners_section_title || 'Our Partners & Supporters'}
          />
        )}
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}


