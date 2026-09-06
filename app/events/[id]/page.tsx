import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import ShareRegistration from '@/components/events/ShareRegistration'
import { createPublicClient } from '@/lib/supabase/public-client'
import { createClient } from '@/lib/supabase/server'
import { getEventPartnerSettings, getEventPartners } from '@/lib/event-partners-settings'
import { Calendar, MapPin, Users, Clock, ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

async function getEvent(id: string): Promise<any> {
  const supabase = createPublicClient()
  // Use select('*') to avoid errors if new columns don't exist yet.
  // PostgREST returns whatever columns exist in the table.
  const { data } = await supabase
    .from('events')
    .select('*')
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

  // Registration count from event_registrations table (may not exist
  // if phase16 migration hasn't been applied - fail gracefully).
  let attendees = 0
  try {
    const { count: regCount, error: regErr } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .neq('status', 'cancelled')
    if (!regErr) attendees = regCount ?? 0
  } catch { /* table doesn't exist yet */ }

  const maxAttendees = event.max_attendees ?? 0
  const spotsLeft = maxAttendees - attendees
  const progress = maxAttendees > 0 ? Math.round((attendees / maxAttendees) * 100) : 0
  const isFull = maxAttendees > 0 && spotsLeft <= 0

  // Registration deadline check
  const regDeadlinePassed = event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()
  const rsvpMode = event.rsvp_mode || 'website'

  // Build the registration URL (relative path — the QR code component
  // will use window.location.origin on the client side).
  const registrationUrl = `/events/${id}/register`

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

        {/* Optional event partners / sponsors — shown right under the banner */}
        {eventPartners.length > 0 && (
          <div className="bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="md:flex-shrink-0 md:border-r md:border-slate-200 md:pr-8">
                  <span className="text-xs uppercase tracking-widest text-primary-600 font-semibold">
                    {partnerSettings.eventPartnersTitle}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  {eventPartners.map((partner) => {
                    const logo = partner.logo_url ? (
                      <div className="h-16 w-32 relative flex items-center justify-center">
                        <Image
                          src={partner.logo_url}
                          alt={partner.name}
                          fill
                          className="object-contain transition-transform duration-300 hover:scale-105"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-700 hover:text-primary-700 transition-colors">
                        {partner.name}
                      </span>
                    )

                    const inner = (
                      <div className="flex flex-col items-center">
                        {logo}
                        <div className="mt-1 text-center">
                          {partner.logo_url && (
                            <span className="text-xs font-medium text-slate-600">{partner.name}</span>
                          )}
                          {partner.contribution && (
                            <span className="block text-[10px] text-primary-600 font-semibold uppercase tracking-wide">
                              {partner.contribution}
                            </span>
                          )}
                        </div>
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
                          className="rounded-xl hover:bg-slate-50 px-3 py-2 transition-colors"
                        >
                          {inner}
                        </a>
                      )
                    }

                    return (
                      <div key={partner.id} className="px-3 py-2" title={partner.name}>
                        {inner}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

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

              {/* Registration */}
              {rsvpMode !== 'none' && !regDeadlinePassed ? (
                <div className="card p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 mb-1">
                    {rsvpMode === 'external' ? 'External Registration' : 'Reserve Your Spot'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {isFull
                      ? 'This event is at capacity. You can still register and we will notify you if a spot opens up.'
                      : rsvpMode === 'external'
                        ? 'Registration is handled through an external form.'
                        : rsvpMode === 'hybrid'
                          ? 'Register here, then complete a short external form.'
                          : "Secure your spot — it's completely free."}
                  </p>

                  {/* Primary CTA based on mode */}
                  {rsvpMode === 'external' ? (
                    <a
                      href={event.external_rsvp_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-base py-3.5 inline-flex justify-center"
                    >
                      {event.external_rsvp_label || 'Register on External Form'}
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  ) : rsvpMode === 'hybrid' ? (
                    <div className="space-y-3">
                      <Link
                        href={`/events/${id}/register`}
                        className="btn-primary w-full text-base py-3.5 inline-flex justify-center"
                      >
                        Register Here First
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      {event.external_rsvp_url && (
                        <a
                          href={event.external_rsvp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-sm text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          {event.external_rsvp_label || 'External Form'} &rarr;
                        </a>
                      )}
                    </div>
                  ) : (
                    /* website mode */
                    <Link
                      href={`/events/${id}/register`}
                      className="btn-primary w-full text-base py-3.5 inline-flex justify-center"
                    >
                      Register Now
                    </Link>
                  )}

                  {/* Shareable link + QR code */}
                  <ShareRegistration url={registrationUrl} />
                </div>
              ) : rsvpMode === 'none' ? (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  Registration is not available for this event.
                </div>
              ) : regDeadlinePassed ? (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  Registration deadline has passed.
                </div>
              ) : (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  Registration is currently closed. Check back soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
