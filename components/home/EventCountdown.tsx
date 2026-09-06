'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'

type EventData = {
  id: string
  title: string
  event_date: string
  start_time: string | null
  location: string
  image_url: string | null
}

function getRemaining(target: number) {
  const diff = target - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    past: false,
  }
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass border border-white/15 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 min-w-[64px] sm:min-w-[80px]">
        <div className="text-2xl sm:text-4xl font-extrabold text-white tabular-nums leading-none">
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-primary-200 uppercase tracking-widest mt-2">
        {label}
      </span>
    </div>
  )
}

export default function EventCountdown({ event }: { event: EventData | null }) {
  const [mounted, setMounted] = useState(false)
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, past: true })

  useEffect(() => {
    if (!event) return
    setMounted(true)
    const target = new Date(`${event.event_date}T${event.start_time || '09:00'}`).getTime()
    setRemaining(getRemaining(target))
    const interval = setInterval(() => setRemaining(getRemaining(target)), 1000)
    return () => clearInterval(interval)
  }, [event])

  if (!event) return null

  const eventDate = new Date(event.event_date).toLocaleDateString('en-KE', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <section className="relative py-16 md:py-20 overflow-hidden bg-hero-gradient">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
          Next Event
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">{event.title}</h2>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-primary-100 mb-8">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {eventDate}
          </span>
          {event.start_time && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {event.start_time}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> {event.location}
          </span>
        </div>

        {/* Countdown */}
        {!remaining.past ? (
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8">
            <TimeBox value={remaining.days} label="Days" />
            <TimeBox value={remaining.hours} label="Hours" />
            <TimeBox value={remaining.minutes} label="Minutes" />
            <TimeBox value={remaining.seconds} label="Seconds" />
          </div>
        ) : (
          <div className="glass border border-white/15 rounded-2xl px-6 py-4 mb-8 inline-block">
            <p className="text-white/90 font-semibold">
              {mounted ? 'This event has started!' : 'Loading...'}
            </p>
          </div>
        )}

        <Link
          href={`/events/${event.id}`}
          className="btn-gold text-base px-8 py-3.5 inline-flex"
        >
          View Details & RSVP
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )
}
