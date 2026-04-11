'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowRight, Users } from 'lucide-react'

const events = [
  {
    id: '1',
    title: 'Community Health Fair 2026',
    description: 'Free medical checkups, health education, and wellness screenings for all community members.',
    date: '2026-04-25',
    location: 'Nairobi Community Center',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    category: 'Health',
    attendees: 350,
  },
  {
    id: '2',
    title: 'Youth Entrepreneurship Summit',
    description: 'A one-day summit connecting young entrepreneurs with mentors, investors, and opportunities.',
    date: '2026-05-10',
    location: 'Westlands Conference Hall, Nairobi',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
    category: 'Economic',
    attendees: 200,
  },
  {
    id: '3',
    title: 'Tree Planting Day',
    description: 'Join us as we plant 5,000 trees across Nairobi County in partnership with local schools.',
    date: '2026-06-05',
    location: 'Multiple Locations, Nairobi',
    image: 'https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=600&q=80',
    category: 'Environment',
    attendees: 500,
  },
]

const categoryColors: Record<string, string> = {
  Health: 'badge-red',
  Economic: 'badge-gold',
  Environment: 'badge-green',
  Education: 'bg-sky-100 text-sky-800 badge',
}

export default function EventsPreview() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={categoryColors[event.category] || 'badge-gray'}>
                    {event.category}
                  </span>
                </div>
                {/* Date badge */}
                <div className="absolute top-3 right-3 bg-white/95 rounded-xl px-3 py-1.5 text-center shadow-sm">
                  <div className="text-xs font-bold text-primary-600 uppercase leading-none">
                    {new Date(event.date).toLocaleString('en-KE', { month: 'short' })}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                    {new Date(event.date).getDate()}
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
                    {new Date(event.date).toLocaleDateString('en-KE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-primary-500" />
                    {event.attendees} expected attendees
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={`/events/${event.id}`}
                    className="px-4 py-2 rounded-full bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                  >
                    RSVP
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

