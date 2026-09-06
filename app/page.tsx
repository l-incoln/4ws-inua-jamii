import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import Hero, { type HeroStat } from '@/components/home/Hero'
import ImpactStats from '@/components/home/ImpactStats'
import ProgramsOverview from '@/components/home/ProgramsOverview'
import EventsPreview from '@/components/home/EventsPreview'
import CallToAction from '@/components/home/CallToAction'
import PartnersSection from '@/components/home/PartnersSection'
import SuccessStories from '@/components/home/SuccessStories'
import DonationProgress from '@/components/home/DonationProgress'
import EventCountdown from '@/components/home/EventCountdown'
import GalleryPreview from '@/components/home/GalleryPreview'
import NewsletterSignup from '@/components/home/NewsletterSignup'
import AnnouncementsTicker from '@/components/home/AnnouncementsTicker'
import VolunteerPreview from '@/components/home/VolunteerPreview'
import AwarenessBanner from '@/components/awareness/AwarenessBanner'
import { createPublicClient } from '@/lib/supabase/public-client'
import { getEventPartnerSettings, getEventPartnersForEvents } from '@/lib/event-partners-settings'
import { getAwarenessDaysForDate, filterByMinPriority } from '@/lib/awareness'
import { buildPageMetadata } from '@/lib/seo'
import JsonLd from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: undefined, // use root default — homepage is the brand page
    description: "Empowering communities through unity, service, and sustainable impact. Join 4W'S Inua Jamii Foundation in building a better tomorrow across Kenya.",
    path: '/',
  })
}

export default async function HomePage() {
  const supabase = createPublicClient()

  // ── Phase 1: Fetch settings first (determines which queries to run) ──
  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'hero_title', 'hero_subtitle', 'hero_cta_label', 'hero_cta_url',
      'hero_badge_text', 'hero_image_url', 'hero_images',
      'hero_include_events',
      'show_impact_stats', 'show_events_preview',
      'show_partners_section', 'partners_section_title',
      'show_awareness_banner', 'awareness_min_priority',
      'show_organization_partners', 'organization_partners_title',
    ])

  const allSettings       = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value ?? '']))
  const heroSettings      = allSettings
  const showStats         = allSettings.show_impact_stats      !== 'false'
  const showEventsPreview = allSettings.show_events_preview    !== 'false'
  const showPartners      = allSettings.show_partners_section  !== 'false'
  const showBanner        = allSettings.show_awareness_banner  !== 'false'
  const minPriority       = (allSettings.awareness_min_priority as 'high' | 'medium' | 'low') || 'medium'
  const heroIncludeEvents = allSettings.hero_include_events === 'true'
  const showOrgPartners   = showPartners && allSettings.show_organization_partners !== 'false'

  const heroImages: string[] = (allSettings.hero_images || '')
    .split(',')
    .map((u: string) => u.trim())
    .filter(Boolean)

  // ── Phase 2: Fetch all data in parallel ──
  const today = new Date().toISOString().split('T')[0]

  const [
    eventsResult,
    impactResult,
    programsResult,
    awarenessResult,
    partnersResult,
    storiesResult,
    campaignsResult,
    galleryResult,
    announcementsResult,
    volunteerResult,
    partnerSettingsResult,
  ] = await Promise.all([
    // Upcoming events (also used for hero slideshow + countdown)
    supabase
      .from('events')
      .select('id, title, description, location, event_date, start_time, image_url, category, max_attendees, status')
      .in('status', ['upcoming', 'ongoing'])
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(4),
    // Impact metrics
    supabase
      .from('impact_metrics')
      .select('id, label, value, unit, icon')
      .order('sort_order', { ascending: true }),
    // Program images
    supabase
      .from('programs')
      .select('slug, image_url')
      .not('image_url', 'is', null),
    // Awareness days (only if banner is enabled)
    showBanner
      ? supabase
          .from('awareness_days')
          .select('id, name, description, month, day, specific_date, category, priority, icon_emoji, theme_color, banner_message, link_url, link_label, is_active')
          .eq('is_active', true)
      : Promise.resolve({ data: [] as any[] }),
    // Organization partners (only if enabled)
    showOrgPartners
      ? supabase
          .from('partners')
          .select('id, name, logo_url, website_url, description, valid_from, valid_until')
          .eq('is_active', true)
          .eq('partner_type', 'organization')
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    // Success stories
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, image_url, category, published_at, read_time')
      .eq('status', 'published')
      .in('category', ['Stories', 'Impact', 'Success Story'])
      .order('published_at', { ascending: false })
      .limit(3),
    // Donation campaigns
    supabase
      .from('donation_campaigns')
      .select('id, slug, title, description, goal, raised, image_url, deadline')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3),
    // Gallery items
    supabase
      .from('gallery_items')
      .select('id, title, image_url, category, event_name')
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8),
    // Announcements
    supabase
      .from('announcements')
      .select('id, title, body, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    // Volunteer tasks
    supabase
      .from('volunteer_tasks')
      .select('id, title, description, skills_required, deadline, status')
      .eq('status', 'open')
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(3),
    // Event partner settings
    getEventPartnerSettings(supabase),
  ])

  const upcomingEvents = eventsResult.data ?? []
  const eventIds = upcomingEvents.map((e) => e.id)

  // ── Phase 3: Dependent queries (need eventIds) ──
  const [rsvpResult, eventSponsorsResult] = await Promise.all([
    eventIds.length > 0
      ? supabase
          .from('rsvps')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('status', 'confirmed')
      : Promise.resolve({ data: [] as any[] }),
    partnerSettingsResult.showEventPartnersListing && eventIds.length > 0
      ? getEventPartnersForEvents(supabase, eventIds).catch(() => ({} as Record<string, any[]>))
      : Promise.resolve({} as Record<string, any[]>),
  ])

  // ── Build derived data ──
  const rsvpCountMap: Record<string, number> = {}
  for (const r of (rsvpResult.data ?? [])) {
    rsvpCountMap[r.event_id] = (rsvpCountMap[r.event_id] ?? 0) + 1
  }

  const heroEventSlides = heroIncludeEvents
    ? upcomingEvents
        .filter((e) => e.image_url)
        .slice(0, 4)
        .map((e) => ({
          id: e.id,
          title: e.title,
          image_url: e.image_url as string,
          event_date: e.event_date,
          location: e.location,
        }))
    : []

  const heroStats: HeroStat[] = (impactResult.data ?? []).slice(0, 3).map((m) => ({
    value: `${m.value}${m.unit || ''}`,
    label: m.label,
    icon: (m.icon as HeroStat['icon']) || 'users',
  }))

  const programDbImages: Record<string, string> = {}
  for (const p of (programsResult.data ?? [])) {
    if (p.slug && p.image_url) programDbImages[p.slug] = p.image_url
  }

  const todaysDays = filterByMinPriority(
    getAwarenessDaysForDate(awarenessResult.data ?? [], new Date()),
    minPriority,
  )

  const nextEvent = upcomingEvents[0] ?? null

  return (
    <>
      <JsonLd type="organization" />
      <JsonLd type="website" />
      <Navbar />
      <main>
        <Hero settings={heroSettings} stats={heroStats} images={heroImages} eventSlides={heroEventSlides} />
        <AnnouncementsTicker announcements={announcementsResult.data ?? []} />
        {showBanner && <AwarenessBanner days={todaysDays} />}
        {showStats && <ImpactStats metrics={impactResult.data ?? []} />}
        <ProgramsOverview dbImages={programDbImages} />
        <SuccessStories stories={storiesResult.data ?? []} />
        <EventCountdown event={nextEvent ? {
          id: nextEvent.id,
          title: nextEvent.title,
          event_date: nextEvent.event_date,
          start_time: nextEvent.start_time,
          location: nextEvent.location,
          image_url: nextEvent.image_url,
        } : null} />
        <DonationProgress campaigns={campaignsResult.data ?? []} />
        {showEventsPreview && <EventsPreview events={upcomingEvents} rsvpCounts={rsvpCountMap} eventSponsors={eventSponsorsResult} sponsorsLabel={partnerSettingsResult.eventPartnersListingLabel} />}
        <GalleryPreview items={galleryResult.data ?? []} />
        <VolunteerPreview tasks={volunteerResult.data ?? []} />
        {showOrgPartners && (partnersResult.data ?? []).length > 0 && (
          <PartnersSection
            partners={(partnersResult.data ?? []) as { id: string; name: string; logo_url: string | null; website_url: string | null; description: string | null; valid_from: string | null; valid_until: string | null }[]}
            title={allSettings.organization_partners_title || allSettings.partners_section_title || 'Our Partners & Sponsors'}
          />
        )}
        <NewsletterSignup />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}
