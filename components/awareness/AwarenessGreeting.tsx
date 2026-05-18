import Link from 'next/link'
import type { AwarenessDay, AwarenessDayWithOffset } from '@/lib/awareness'
import { getCategoryMeta } from '@/lib/awareness'

type Props = {
  todayDays: AwarenessDay[]
  upcomingDays: AwarenessDayWithOffset[]  // used when nothing is on today
  memberName?: string
}

export default function AwarenessGreeting({ todayDays, upcomingDays, memberName }: Props) {
  // ── Today has active awareness days ─────────────────────────
  if (todayDays.length > 0) {
    const primary = todayDays[0]
    const meta = getCategoryMeta(primary.category)

    // Personalise the message: replace placeholder or append name
    const rawMessage = primary.banner_message ?? primary.description ?? ''
    const message = memberName
      ? rawMessage.replace('!', `, ${memberName}!`)
      : rawMessage

    return (
      <div
        className={`rounded-2xl border ${meta.cardBorderClass} ${meta.cardGradientClass} p-5`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${meta.iconBgClass}`}
          >
            {primary.icon_emoji ?? '📅'}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${meta.badgeBgClass} ${meta.badgeTextClass}`}
              >
                {meta.emoji}&nbsp;{meta.label}
              </span>
              {todayDays.length > 1 && (
                <span className="text-xs text-slate-500">
                  +{todayDays.length - 1} more today
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 mt-1 text-base">{primary.name}</h3>

            {message && (
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{message}</p>
            )}

            {primary.link_url && primary.link_label && (
              <Link
                href={primary.link_url}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors mt-2"
              >
                {primary.link_label}&nbsp;→
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Nothing today — show next upcoming day within 7 days ────
  const next = upcomingDays.find((d) => d.daysUntil > 0 && d.daysUntil <= 7)
  if (!next) return null

  const meta = getCategoryMeta(next.category)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Coming Up
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${meta.iconBgClass}`}
        >
          {next.icon_emoji ?? '📅'}
        </div>
        <div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badgeBgClass} ${meta.badgeTextClass}`}
          >
            {next.dateLabel}
          </span>
          <h3 className="font-bold text-slate-900 mt-1 text-sm">{next.name}</h3>
          <p className="text-xs text-slate-500">{meta.emoji}&nbsp;{meta.label}</p>
        </div>
      </div>
    </div>
  )
}
