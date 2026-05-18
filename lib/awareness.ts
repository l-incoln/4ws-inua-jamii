// ============================================================
// Intelligent Calendar & Awareness System — Utilities
// ============================================================

export type AwarenessDay = {
  id: string
  name: string
  description: string | null
  month: number | null
  day: number | null
  specific_date: string | null
  category: string
  priority: 'high' | 'medium' | 'low'
  icon_emoji: string | null
  theme_color: string | null
  banner_message: string | null
  link_url: string | null
  link_label: string | null
  is_active: boolean
}

export type AwarenessDayWithOffset = AwarenessDay & {
  daysUntil: number
  dateLabel: string
  isoDate: string
}

/** Returns all awareness days that match the given date. */
export function getAwarenessDaysForDate(
  days: AwarenessDay[],
  date: Date,
): AwarenessDay[] {
  const m = date.getMonth() + 1
  const d = date.getDate()
  const ds = date.toISOString().split('T')[0]

  return days.filter((day) => {
    if (!day.is_active) return false
    if (day.specific_date) return day.specific_date === ds
    return day.month === m && day.day === d
  })
}

/**
 * Returns awareness days within the next `ahead` days (inclusive of today),
 * sorted by daysUntil then priority.
 */
export function getUpcomingAwarenessDays(
  days: AwarenessDay[],
  from: Date,
  ahead = 30,
): AwarenessDayWithOffset[] {
  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const result: AwarenessDayWithOffset[] = []

  for (let i = 0; i <= ahead; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    const isoDate = d.toISOString().split('T')[0]
    const dateLabel =
      i === 0
        ? 'Today'
        : i === 1
        ? 'Tomorrow'
        : d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })

    for (const day of getAwarenessDaysForDate(days, d)) {
      result.push({ ...day, daysUntil: i, dateLabel, isoDate })
    }
  }

  return result.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil
    return (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2)
  })
}

// ── Category display metadata ────────────────────────────────

export type CategoryMeta = {
  label: string
  emoji: string
  /** Full Tailwind gradient class for banner backgrounds */
  gradientClass: string
  /** Full Tailwind gradient class (subtle) for card backgrounds */
  cardGradientClass: string
  cardBorderClass: string
  badgeBgClass: string
  badgeTextClass: string
  iconBgClass: string
  iconTextClass: string
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  kenyan_national: {
    label: 'Kenyan National Day',
    emoji: '🇰🇪',
    gradientClass: 'bg-gradient-to-r from-green-700 to-green-600',
    cardGradientClass: 'bg-gradient-to-br from-green-50 to-green-100/40',
    cardBorderClass: 'border-green-300',
    badgeBgClass: 'bg-green-100',
    badgeTextClass: 'text-green-800',
    iconBgClass: 'bg-green-100',
    iconTextClass: 'text-green-700',
  },
  international: {
    label: 'International Day',
    emoji: '🌐',
    gradientClass: 'bg-gradient-to-r from-sky-600 to-sky-700',
    cardGradientClass: 'bg-gradient-to-br from-sky-50 to-sky-100/40',
    cardBorderClass: 'border-sky-300',
    badgeBgClass: 'bg-sky-100',
    badgeTextClass: 'text-sky-800',
    iconBgClass: 'bg-sky-100',
    iconTextClass: 'text-sky-700',
  },
  ngo_environmental: {
    label: 'Environmental Day',
    emoji: '🌿',
    gradientClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
    cardGradientClass: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40',
    cardBorderClass: 'border-emerald-300',
    badgeBgClass: 'bg-emerald-100',
    badgeTextClass: 'text-emerald-800',
    iconBgClass: 'bg-emerald-100',
    iconTextClass: 'text-emerald-700',
  },
  community_volunteer: {
    label: 'Community Day',
    emoji: '🤝',
    gradientClass: 'bg-gradient-to-r from-amber-500 to-amber-600',
    cardGradientClass: 'bg-gradient-to-br from-amber-50 to-amber-100/40',
    cardBorderClass: 'border-amber-300',
    badgeBgClass: 'bg-amber-100',
    badgeTextClass: 'text-amber-800',
    iconBgClass: 'bg-amber-100',
    iconTextClass: 'text-amber-700',
  },
  education_youth: {
    label: 'Education & Youth',
    emoji: '📚',
    gradientClass: 'bg-gradient-to-r from-violet-600 to-violet-700',
    cardGradientClass: 'bg-gradient-to-br from-violet-50 to-violet-100/40',
    cardBorderClass: 'border-violet-300',
    badgeBgClass: 'bg-violet-100',
    badgeTextClass: 'text-violet-800',
    iconBgClass: 'bg-violet-100',
    iconTextClass: 'text-violet-700',
  },
  foundation: {
    label: 'Foundation Day',
    emoji: '🏛️',
    gradientClass: 'bg-gradient-to-r from-primary-600 to-primary-700',
    cardGradientClass: 'bg-gradient-to-br from-primary-50 to-primary-100/40',
    cardBorderClass: 'border-primary-300',
    badgeBgClass: 'bg-primary-100',
    badgeTextClass: 'text-primary-800',
    iconBgClass: 'bg-primary-100',
    iconTextClass: 'text-primary-700',
  },
}

const DEFAULT_CATEGORY_META: CategoryMeta = {
  label: 'Awareness Day',
  emoji: '📅',
  gradientClass: 'bg-gradient-to-r from-slate-600 to-slate-700',
  cardGradientClass: 'bg-gradient-to-br from-slate-50 to-slate-100/40',
  cardBorderClass: 'border-slate-300',
  badgeBgClass: 'bg-slate-100',
  badgeTextClass: 'text-slate-700',
  iconBgClass: 'bg-slate-100',
  iconTextClass: 'text-slate-600',
}

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META
}

// ── Priority display metadata ────────────────────────────────

export type PriorityMeta = {
  label: string
  dotClass: string
  badgeClass: string
}

export function getPriorityMeta(priority: string): PriorityMeta {
  const map: Record<string, PriorityMeta> = {
    high:   { label: 'High',   dotClass: 'bg-rose-500',  badgeClass: 'bg-rose-100 text-rose-700' },
    medium: { label: 'Medium', dotClass: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700' },
    low:    { label: 'Low',    dotClass: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-600' },
  }
  return map[priority] ?? map.low
}

/** Filters days by minimum priority level */
export function filterByMinPriority(
  days: AwarenessDay[],
  minPriority: 'high' | 'medium' | 'low' = 'medium',
): AwarenessDay[] {
  const rank: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const threshold = rank[minPriority] ?? 1
  return days.filter((d) => (rank[d.priority] ?? 2) <= threshold)
}
