import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import RsvpButton from '@/components/events/RsvpButton'
import { createPublicClient } from '@/lib/supabase/public-client'
import { createClient } from '@/lib/supabase/server'
import { getEventPartnerSettings, getEventPartners } from '@/lib/event-partners-settings'
import { Calendar, MapPin, Users, Clock, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

async function getEvent(id: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, description, location, address, event_date, start_time, end_time, image_url, category, max_attendees, status')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return { title: 'Event Not Found' }
  return { title: event.title, description: event.description }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const supabase = await createClient()

  // Count confirmed RSVPs
  const { count: rsvpCount } = await supabase
    .from('rsvps')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'confirmed')

  const attendees = rsvpCount ?? 0
  const maxAttendees = event.max_attendees ?? 0
  const spotsLeft = maxAttendees - attendees
  const progress = maxAttendees > 0 ? Math.round((attendees / maxAttendees) * 100) : 0
  const isFull = maxAttendees > 0 && spotsLeft <= 0

  // Auth + existing RSVP status
  const { data: { user } } = await supabase.auth.getUser()
  let rsvpStatus: 'confirmed' | 'waitlisted' | 'cancelled' | null = null
  if (user) {
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (rsvp) rsvpStatus = rsvp.status as typeof rsvpStatus
  }

  // CMS RSVP setting
  const { data: rsvpSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'rsvp_enabled')
    .maybeSingle()
  const rsvpEnabled = rsvpSetting?.value !== 'false'

  // Optional event partners (only fetched/shown when the feature is enabled).
  const publicClient = createPublicClient()
  const partnerSettings = await getEventPartnerSettings(publicClient)
  const eventPartners = partnerSettings.showEventPartners
    ? await getEventPartners(publicClient, id)
    : []

  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date TBC'
  const timeRange = [event.start_time, event.end_time].filter(Boolean).join(' – ') || 'Time TBC'

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="relative h-80 md:h-[28rem] bg-slate-900">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-contain" />
          ) : (
            <div className="absolute inset-0 bg-primary-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10">
              <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> All Events
              </Link>
              <span className="badge bg-primary-500 text-white mb-3 inline-block">{event.category}</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white max-w-3xl">{event.title}</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Event</h2>
                {(event.description ?? '').split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="text-slate-600 leading-relaxed mb-4">{para}</p>
                ))}
              </div>
              {event.address && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Getting There</h2>
                  <p className="text-slate-600">{event.address}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event info card */}
              <div className="card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Date</div>
                    <div className="text-sm text-slate-500">{eventDate}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Time</div>
                    <div className="text-sm text-slate-500">{timeRange}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Location</div>
                    <div className="text-sm text-slate-500">{event.location}</div>
                  </div>
                </div>
                {maxAttendees > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">Attendance</div>
                      <div className="text-sm text-slate-500">
                        {attendees} registered · {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-amber-400' : 'bg-primary-500'}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{progress}% capacity reached</div>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP */}
              {rsvpEnabled ? (
                <div className="card p-6">
                  <h3 className="font-bold text-slate-900 mb-1">Reserve Your Spot</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {isFull
                      ? 'This event is at capacity. Join the waitlist to be notified if a spot opens up.'
                      : "Secure your spot — it's completely free."}
                  </p>
                  <RsvpButton
                    eventId={id}
                    isLoggedIn={!!user}
                    initialStatus={rsvpStatus}
                    isFull={isFull}
                  />
                </div>
              ) : (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  RSVPs are currently closed. Check back soon.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional event partners / sponsors */}
        {eventPartners.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-8 md:p-12">
              <div className="text-center mb-8">
                <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
                  {partnerSettings.eventPartnersTitle}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                  This event is made possible with our partners
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                {eventPartners.map((partner) => {
                  const inner = partner.logo_url ? (
                    <div className="h-24 w-48 relative flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 p-3 hover:shadow-md hover:border-primary-200 transition-all duration-300">
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        fill
                        className="object-contain p-3 transition-transform duration-300 hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="px-7 py-5 rounded-2xl border-2 border-slate-200 bg-white shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-300">
                      <span className="text-base font-bold text-slate-700 hover:text-primary-700 transition-colors">
                        {partner.name}
                      </span>
                    </div>
                  )

                  const label = (
                    <div className="mt-2 text-center">
                      <div className="text-sm font-semibold text-slate-800">{partner.name}</div>
                      {partner.contribution && (
                        <div className="text-xs text-primary-600 font-medium mt-0.5">
                          {partner.contribution}
                        </div>
                      )}
                      {partner.description && (
                        <div className="text-xs text-slate-500 mt-1 max-w-[16rem] line-clamp-2">
                          {partner.description}
                        </div>
                      )}
                    </div>
                  )

                  if (partner.website_url) {
                    return (
                      <a
                        key={partner.id}
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={partner.name}
                        className="flex flex-col items-center transition-transform duration-200 hover:scale-105"
                      >
                        {inner}
                        {label}
                      </a>
                    )
                  }

                  return (
                    <div key={partner.id} className="flex flex-col items-center" title={partner.name}>
                      {inner}
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
