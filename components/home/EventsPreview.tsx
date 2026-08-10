'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowRight, Users } from 'lucide-react'

type Event = {
  id: string
  title: string
  description: string | null
  event_date: string
  location: string
  image_url: string | null
  category: string | null
  max_attendees: number | null
  status: string
}

const categoryColors: Record<string, string> = {
  Health: 'badge-red',
  Economic: 'badge-gold',
  Environment: 'badge-green',
  Education: 'bg-sky-100 text-sky-800 badge',
}

export default function EventsPreview({
  events = [],
  rsvpCounts = {},
}: {
  events?: Event[]
  rsvpCounts?: Record<string, number>
}) {
  const displayEvents = events.slice(0, 3)

  return (
    <section className="py-16 md:py-24 bg-white section-accent-bar relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(#1E3A8A 1px, transparent 1px), linear-gradient(90deg, #1E3A8A 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
              Upcoming Events
            </span>
            <h2 className="section-title">Join the Movement</h2>
            <p className="section-subtitle max-w-xl mt-2">
              Be part of the change. Attend our events and make a real difference in your community.
            </p>
          </div>
          <Link href="/events" className="btn-secondary shrink-0">
            All Events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Events */}
        {displayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayEvents.map((event, i) => {
              const date = event.event_date
              const rsvpCount = rsvpCounts[event.id] ?? 0
              return (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="card card-glow-primary group cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {event.image_url ? (
                    <Image
                      src={event.image_url}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-600" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={categoryColors[event.category ?? ''] || 'badge-gray'}>
                      {event.category ?? 'Event'}
                    </span>
                  </div>
                  {/* Date badge */}
                  <div className="absolute top-3 right-3 bg-white/95 rounded-xl px-3 py-1.5 text-center shadow-sm">
                    <div className="text-xs font-bold text-primary-600 uppercase leading-none">
                      {new Date(date).toLocaleString('en-KE', { month: 'short' })}
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                      {new Date(date).getDate()}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      {new Date(date).toLocaleDateString('en-KE', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-primary-500" />
                      {event.location}
                    </div>
                    {event.max_attendees && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 text-primary-500" />
                        {rsvpCount} / {event.max_attendees} RSVPs
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1.5 group/link transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href={`/events/${event.id}`}
                      className="px-4 py-2 rounded-full bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      RSVP
                    </Link>
                  </div>
                </div>
              </motion.article>
            )
          })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            No upcoming events are available right now. New events added in the CMS will appear here automatically.
          </div>
        )}
      </div>
    </section>
  )
}
