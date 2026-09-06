'use client'

import { useState, useEffect } from 'react'
import { Megaphone, X } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  body: string | null
  is_pinned: boolean
}

export default function AnnouncementsTicker({ announcements = [] }: { announcements?: Announcement[] }) {
  const [dismissed, setDismissed] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (announcements.length <= 1) return
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements.length])

  if (announcements.length === 0 || dismissed) return null

  const current = announcements[index]

  return (
    <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 text-white z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5">
          {/* Megaphone icon */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">
              Update
            </span>
          </div>

          {/* Scrolling/rotating text */}
          <div className="flex-1 overflow-hidden">
            <div key={current.id} className="animate-fade-in">
              <span className="text-sm font-semibold">{current.title}</span>
              {current.body && (
                <span className="text-sm text-white/80 hidden md:inline"> — {current.body}</span>
              )}
            </div>
          </div>

          {/* Dots indicator */}
          {announcements.length > 1 && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {announcements.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === index ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Announcement ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss announcements"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
