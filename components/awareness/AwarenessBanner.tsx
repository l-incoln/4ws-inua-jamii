'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AwarenessDay } from '@/lib/awareness'
import { getCategoryMeta } from '@/lib/awareness'

export default function AwarenessBanner({ days }: { days: AwarenessDay[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [idx, setIdx] = useState(0)

  // Load persisted dismissals (per-day, reset each new date)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const stored: string[] = JSON.parse(
        localStorage.getItem(`awareness_dismissed_${today}`) ?? '[]',
      )
      setDismissed(new Set(stored))
    } catch {
      // ignore parse errors
    }
  }, [])

  const activeDays = days.filter((d) => !dismissed.has(d.id))
  if (activeDays.length === 0) return null

  const safeIdx = Math.min(idx, activeDays.length - 1)
  const day = activeDays[safeIdx]
  const meta = getCategoryMeta(day.category)

  const dismiss = (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    try {
      localStorage.setItem(
        `awareness_dismissed_${today}`,
        JSON.stringify(Array.from(next)),
      )
    } catch {
      // ignore storage errors
    }
    if (safeIdx >= activeDays.length - 1) setIdx(Math.max(0, safeIdx - 1))
  }

  const prev = () => setIdx(Math.max(0, safeIdx - 1))
  const next = () => setIdx(Math.min(activeDays.length - 1, safeIdx + 1))

  return (
    <div className={`${meta.gradientClass} text-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3 md:gap-5">

          {/* Emoji icon */}
          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-white/15 items-center justify-center text-2xl flex-shrink-0">
            {day.icon_emoji ?? '📅'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/20 rounded-full px-2.5 py-0.5 border border-white/20">
                {meta.emoji}&nbsp;{meta.label}
              </span>
              {activeDays.length > 1 && (
                <span className="text-xs text-white/60">
                  {activeDays.length} observances today
                </span>
              )}
            </div>
            <p className="text-base font-bold mt-0.5 leading-snug">{day.name}</p>
            {day.banner_message && (
              <p className="text-sm text-white/80 mt-0.5 leading-relaxed line-clamp-1 hidden md:block">
                {day.banner_message}
              </p>
            )}
          </div>

          {/* CTA button */}
          {day.link_url && day.link_label && (
            <Link
              href={day.link_url}
              className="hidden md:inline-flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold text-sm transition-colors"
            >
              {day.link_label}&nbsp;→
            </Link>
          )}

          {/* Multi-day navigation */}
          {activeDays.length > 1 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={prev}
                disabled={safeIdx === 0}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/25 transition-colors disabled:opacity-30"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/60 w-10 text-center tabular-nums">
                {safeIdx + 1} / {activeDays.length}
              </span>
              <button
                onClick={next}
                disabled={safeIdx === activeDays.length - 1}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/25 transition-colors disabled:opacity-30"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={() => dismiss(day.id)}
            className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-colors"
            aria-label="Dismiss awareness banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
