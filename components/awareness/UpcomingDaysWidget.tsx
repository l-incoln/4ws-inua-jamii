import Link from 'next/link'
import { CalendarDays, ChevronRight } from 'lucide-react'
import type { AwarenessDayWithOffset } from '@/lib/awareness'
import { getCategoryMeta, getPriorityMeta } from '@/lib/awareness'

export default function UpcomingDaysWidget({
  days,
}: {
  days: AwarenessDayWithOffset[]
}) {
  if (days.length === 0) return null

  const todayDays  = days.filter((d) => d.daysUntil === 0)
  const futureDays = days.filter((d) => d.daysUntil > 0)
  const display    = days.slice(0, 15)
  const overflow   = days.length - display.length

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-600" />
          <h2 className="font-bold text-slate-900">Awareness Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          {todayDays.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">
              {todayDays.length} today
            </span>
          )}
          <span className="text-xs text-slate-400">Next 30 days</span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {display.map((d) => {
          const cat = getCategoryMeta(d.category)
          const pri = getPriorityMeta(d.priority)
          const isToday = d.daysUntil === 0
          const isTomorrow = d.daysUntil === 1

          return (
            <div
              key={`${d.id}-${d.isoDate}`}
              className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                isToday
                  ? 'bg-primary-50/60 hover:bg-primary-50'
                  : 'hover:bg-gray-50/60'
              }`}
            >
              {/* Emoji */}
              <div className="text-2xl flex-shrink-0 w-8 text-center">
                {d.icon_emoji ?? '📅'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                    {d.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${pri.badgeClass}`}>
                    {pri.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? 'text-primary-600'
                        : isTomorrow
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {d.dateLabel}
                  </span>
                  <span className="text-xs text-slate-400">
                    {cat.emoji}&nbsp;{cat.label}
                  </span>
                </div>
              </div>

              {/* Link arrow */}
              {d.link_url && (
                <Link
                  href={d.link_url}
                  className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title={`Go to ${d.link_label ?? 'link'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Overflow notice */}
      {overflow > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-slate-50/50">
          <p className="text-xs text-slate-400 text-center">
            +{overflow} more observances in the next 30 days
          </p>
        </div>
      )}

      {/* Empty upcoming */}
      {futureDays.length === 0 && todayDays.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-400">No upcoming observances in the next 30 days.</p>
        </div>
      )}
    </div>
  )
}
