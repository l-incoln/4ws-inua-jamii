import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RsvpButton from '@/components/events/RsvpButton'
import { createClient } from '@/lib/supabase/server'
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2 } from 'lucide-react'
import type { Metadata } from 'next'

const eventsData: Record<string, {
  title: string
  description: string
  fullDescription: string
  date: string
  time: string
  location: string
  image: string
  category: string
  attendees: number
  maxAttendees: number
  schedule: { time: string; activity: string }[]
  requirements: string[]
}> = {
  '1': {
    title: 'Community Health Fair 2026',
    description: 'Free medical checkups, health screenings, dental care, and wellness education.',
    fullDescription: `Join us for our biggest Community Health Fair of the year. This free event brings together medical professionals, healthcare organizations, and community health workers to provide essential services to those who need them most.

Services will include general health checkups, blood pressure screening, diabetes testing, dental checkups, eye testing, maternal health consultations, mental wellness support, and free medication distribution.

All services are completely free. No appointment needed. Bring your family and neighbors.`,
    date: '2026-04-25',
    time: '8:00 AM - 5:00 PM',
    location: 'Nairobi Community Center, Westlands',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
    category: 'Health',
    attendees: 350,
    maxAttendees: 500,
    schedule: [
      { time: '8:00 AM', activity: 'Gates open, registration begins' },
      { time: '8:30 AM', activity: 'Opening ceremony and address' },
      { time: '9:00 AM', activity: 'Health screenings begin' },
      { time: '12:00 PM', activity: 'Lunch break & networking' },
      { time: '1:00 PM', activity: 'Health education workshops' },
      { time: '3:00 PM', activity: 'Mental wellness sessions' },
      { time: '4:30 PM', activity: 'Closing remarks & certificates' },
    ],
    requirements: [
      'Open to all community members — free entry',
      'Bring your national ID or birth certificate',
      'Children must be accompanied by a guardian',
      'Comfortable clothing recommended for screenings',
    ],
  },
  '2': {
    title: 'Youth Entrepreneurship Summit',
    description: 'Connecting young entrepreneurs with mentors, investors, and opportunities.',
    fullDescription: `The Youth Entrepreneurship Summit is a one-day power-packed event for young business owners, aspiring entrepreneurs, and innovators between the ages of 18 and 35.

This year's theme: "From Idea to Impact" — featuring keynote speakers from Kenya's top companies, hands-on workshops, a pitch competition with prizes, networking sessions, and one-on-one mentorship meetings.

Whether you have a business idea, a startup in progress, or an existing business looking to grow — this summit is for you.`,
    date: '2026-05-10',
    time: '9:00 AM - 6:00 PM',
    location: 'Westlands Conference Hall, Nairobi',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    category: 'Economic',
    attendees: 120,
    maxAttendees: 200,
    schedule: [
      { time: '9:00 AM', activity: 'Registration and breakfast networking' },
      { time: '9:30 AM', activity: 'Opening keynote: The Opportunity Landscape' },
      { time: '10:30 AM', activity: 'Workshop 1: Building a Business Model' },
      { time: '12:00 PM', activity: 'Lunch and investor networking' },
      { time: '1:30 PM', activity: 'Pitch competition — 10 startups' },
      { time: '3:30 PM', activity: 'Panel: Funding Your Vision' },
      { time: '5:00 PM', activity: 'Awards ceremony and closing' },
    ],
    requirements: [
      'Open to youth aged 18-35',
      'Registration required (RSVP below)',
      'Bring business cards and elevator pitch',
      'Laptop or notebook recommended',
    ],
  },
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = eventsData[params.id]
  if (!event) return { title: 'Event Not Found' }
  return { title: event.title, description: event.description }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = eventsData[params.id]
  if (!event) notFound()

  const spotsLeft = event.maxAttendees - event.attendees
  const progress = Math.round((event.attendees / event.maxAttendees) * 100)
  const isFull = spotsLeft <= 0

  // Check auth + existing RSVP status
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let rsvpStatus: 'confirmed' | 'waitlisted' | 'cancelled' | null = null
  if (user) {
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (rsvp) rsvpStatus = rsvp.status as typeof rsvpStatus
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="relative h-72 md:h-96">
          <Image src={event.image} alt={event.title} fill className="object-cover" />
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
                {event.fullDescription.split('\n\n').map((para, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed mb-4">{para}</p>
                ))}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Event Schedule</h2>
                <div className="space-y-3">
                  {event.schedule.map(({ time, activity }) => (
                    <div key={time} className="flex gap-4">
                      <div className="w-24 text-sm font-semibold text-primary-600 shrink-0 pt-0.5">{time}</div>
                      <div className="flex-1 text-sm text-slate-600 border-l-2 border-gray-100 pl-4 pb-3">{activity}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {event.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2.5 text-slate-600 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event info card */}
              <div className="card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Date & Time</div>
                    <div className="text-sm text-slate-500">
                      {new Date(event.date).toLocaleDateString('en-KE', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> {event.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Location</div>
                    <div className="text-sm text-slate-500">{event.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Attendance</div>
                    <div className="text-sm text-slate-500">
                      {event.attendees} registered · {spotsLeft} spots left
                    </div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{progress}% capacity reached</div>
                  </div>
                </div>
              </div>

              {/* RSVP */}
              <div className="card p-6">
                <h3 className="font-bold text-slate-900 mb-1">Reserve Your Spot</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {isFull
                    ? 'This event is at capacity. Join the waitlist to be notified if a spot opens up.'
                    : 'Secure your spot — it\'s completely free.'}
                </p>
                <RsvpButton
                  eventId={params.id}
                  isLoggedIn={!!user}
                  initialStatus={rsvpStatus}
                  isFull={isFull}
                />
              </div>

              {/* Share */}
              <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors w-full justify-center">
                <Share2 className="w-4 h-4" />
                Share this Event
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
