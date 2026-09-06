'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react'

const categoryColors: Record<string, string> = {
  Health: 'badge-red',
  Economic: 'badge-sky',
  Environment: 'badge-green',
  Education: 'bg-sky-100 text-sky-800 badge',
  Empowerment: 'bg-purple-100 text-purple-800 badge',
  Fundraiser: 'bg-indigo-100 text-indigo-800 badge',
}

interface EventItem {
  id: string
  title: string
  description?: string | null
  event_date: string
  start_time?: string | null
  end_time?: string | null
  location: string
  image_url?: string | null
  category?: string | null
  status: string
  max_attendees?: number | null
}

type EventSponsor = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  contribution: string | null
}

interface Props {
  events: EventItem[]
  rsvpCounts: Record<string, number>
  categories: string[]
  eventSponsors?: Record<string, EventSponsor[]>
  sponsorsLabel?: string
}

function SponsorStrip({ sponsors, label }: { sponsors: EventSponsor[]; label: string }) {
  if (sponsors.length === 0) return null
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        {sponsors.map((s) => {
          const inner = s.logo_url ? (
            <div className="h-8 w-16 relative flex items-center justify-center rounded bg-white border border-slate-100 p-1">
              <Image
                src={s.logo_url}
                alt={s.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-600 px-2 py-1 rounded bg-white border border-slate-100">
              {s.name}
            </span>
          )
          if (s.website_url) {
            return (
              <a
                key={s.id}
                href={s.website_url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.contribution ? `${s.name} — ${s.contribution}` : s.name}
                className="transition-transform hover:scale-105"
              >
                {inner}
              </a>
            )
          }
          return (
            <div key={s.id} title={s.contribution ? `${s.name} — ${s.contribution}` : s.name}>
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventCard({
  event,
  attendees,
  showCompleted,
  sponsors,
  sponsorsLabel,
}: {
  event: EventItem
  attendees: number
  showCompleted?: boolean
  sponsors?: EventSponsor[]
  sponsorsLabel?: string
}) {
  const capacity = event.max_attendees ?? 0
  const pct = capacity > 0 ? Math.min((attendees / capacity) * 100, 100) : 0
  const timeStr = event.start_time
    ? event.end_time ? `${event.start_time} – ${event.end_time}` : event.start_time
    : ''

  if (showCompleted) {
    return (
      <article className="card group opacity-80">
        <div className="relative h-40 overflow-hidden grayscale bg-gray-100">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-contain" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30" />
          <span className="absolute top-3 left-3 badge bg-gray-100 text-gray-700">Completed</span>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-slate-700">{event.title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <Calendar className="w-3 h-3" />
            {new Date(event.event_date).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {attendees > 0 && <div className="text-xs text-slate-400 mt-1">{attendees} attended</div>}
          {sponsors && sponsors.length > 0 && (
            <SponsorStrip sponsors={sponsors} label={sponsorsLabel || 'Sponsored by'} />
          )}
        </div>
      </article>
    )
  }

  return (
    <article className="card group bg-white">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-primary-100 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-primary-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={categoryColors[event.category ?? ''] ?? 'badge-gray'}>{event.category ?? 'Event'}</span>
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
        <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>
        )}

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-primary-500" />
            {new Date(event.event_date).toLocaleDateString('en-KE', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
            {timeStr ? ` · ${timeStr}` : ''}
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

        {capacity > 0 && (
          <div className="mt-4">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {Math.max(0, capacity - attendees)} spots remaining
            </p>
          </div>
        )}

        {sponsors && sponsors.length > 0 && (
          <SponsorStrip sponsors={sponsors} label={sponsorsLabel || 'Sponsored by'} />
        )}

        <div className="mt-5 flex items-center justify-between">
          <Link href={`/events/${event.id}`} className="text-sm font-semibold text-primary-600 flex items-center gap-1 hover:gap-2 transition-all">
            Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link href={`/events/${event.id}`} className="px-4 py-2 rounded-full bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors">
            RSVP Now
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function EventsGrid({ events, rsvpCounts, categories, eventSponsors, sponsorsLabel }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')

  const today = new Date().toISOString().split('T')[0]

  // An event is "upcoming" only if its date is today or in the future,
  // regardless of the status field (which may not have been updated).
  const upcoming = events.filter((e) =>
    (e.status === 'upcoming' || e.status === 'ongoing') && e.event_date >= today
  )
  // Past events: either explicitly marked completed, or whose date has passed.
  const completed = events.filter((e) =>
    e.status === 'completed' || e.event_date < today
  )

  const filteredUpcoming = activeCategory === 'All'
    ? upcoming
    : upcoming.filter((e) => e.category === activeCategory)

  const filteredCompleted = activeCategory === 'All'
    ? completed
    : completed.filter((e) => e.category === activeCategory)

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
          <p className="text-slate-500 text-sm mt-1">{filteredUpcoming.length} events coming up</p>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {filteredUpcoming.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No upcoming events in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredUpcoming.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              attendees={rsvpCounts[event.id] ?? 0}
              sponsors={eventSponsors?.[event.id]}
              sponsorsLabel={sponsorsLabel}
            />
          ))}
        </div>
      )}

      {/* Past events */}
      {filteredCompleted.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompleted.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                attendees={rsvpCounts[event.id] ?? 0}
                showCompleted
                sponsors={eventSponsors?.[event.id]}
                sponsorsLabel={sponsorsLabel}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
