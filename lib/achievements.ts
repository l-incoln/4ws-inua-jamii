// ============================================================
// Achievement System — core logic
//
// Four connected elements:
//   ⭐ Points       — activity-weighted total (events×10, tasks×15,
//                     comments×2, donations×20). Computed by the
//                     member_impact_scores DB view.
//   📊 Impact Score — reflects meaning & level, not just task count.
//                     = points + floor(donation_amount_total / 1000)
//                       + badges_earned × 10
//                     Generous giving and breadth (badges) lift it
//                     above raw activity count.
//   🥇 Rank         — tier based on Impact Score, with progress to
//                     the next tier and a percentile position.
//   🏅 Badges       — auto-unlocked from criteria. NOT all point-
//                     based: Founder Member = join date, Leader =
//                     verified admin role, Champion Donor = verified
//                     giving amount.
//
// The syncMemberBadges() function is the single entry point that
// checks every criterion and awards any newly-earned badge (with a
// notification). Call it on the achievements page and dashboard home
// so badges are always current when a member views their profile.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { BadgeType, MembershipTier } from '@/types'
import { BADGE_META } from '@/lib/badge-meta'

// ---------------------------------------------------------------------------
// Rank tiers — ordered low → high. Thresholds are Impact Score cutoffs.
// ---------------------------------------------------------------------------
export interface RankTier {
  name: string
  min: number          // inclusive minimum impact score for this tier
  emoji: string
  gradient: string     // tailwind gradient classes
}

export const RANK_TIERS: RankTier[] = [
  { name: 'Starter',  min: 0,    emoji: '🌱', gradient: 'from-blue-400 to-cyan-500' },
  { name: 'Bronze',   min: 100,  emoji: '🥉', gradient: 'from-orange-400 to-red-400' },
  { name: 'Silver',   min: 250,  emoji: '🥈', gradient: 'from-slate-400 to-slate-500' },
  { name: 'Gold',     min: 500,  emoji: '🥇', gradient: 'from-amber-400 to-orange-500' },
  { name: 'Platinum', min: 1000, emoji: '💎', gradient: 'from-violet-400 to-purple-600' },
]

export interface RankInfo {
  current: RankTier
  next: RankTier | null
  /** 0–1 progress toward the next tier (1 if max tier). */
  progress: number
  /** Points/score still needed to reach the next tier (0 if max). */
  toNext: number
}

export function computeRank(impactScore: number): RankInfo {
  let current = RANK_TIERS[0]
  let next: RankTier | null = null

  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (impactScore >= RANK_TIERS[i].min) {
      current = RANK_TIERS[i]
      next = RANK_TIERS[i + 1] ?? null
    }
  }

  if (!next) return { current, next: null, progress: 1, toNext: 0 }

  const span = next.min - current.min
  const done = Math.max(0, impactScore - current.min)
  return {
    current,
    next,
    progress: Math.min(done / span, 1),
    toNext: Math.max(0, next.min - impactScore),
  }
}

// ---------------------------------------------------------------------------
// Impact Score — distinct from raw points.
//   points               = total_score from the view (activity × weight)
//   impactScore          = points + floor(donation_amount_total / 1000)
//                          + badgesEarned × 10
// The donation-amount bonus rewards the *level* of giving (a KES 50,000
// donor scores higher than five KES 100 donors even though both made 5
// donations). The badge bonus rewards *breadth* of contribution.
// ---------------------------------------------------------------------------
export function computeImpactScore(
  points: number,
  donationAmountTotal: number,
  badgesEarned: number,
): number {
  return points + Math.floor(donationAmountTotal / 1000) + badgesEarned * 10
}

// ---------------------------------------------------------------------------
// Badge criteria — each badge maps to a check against member metrics.
//
// `metric` identifies which number the progress bar tracks.
// `dateBased` / `roleBased` badges have no numeric progress (binary).
// ---------------------------------------------------------------------------
export type BadgeMetric =
  | 'points'                 // active_member
  | 'events_attended'        // event_hero
  | 'tasks_completed'        // volunteer
  | 'donation_amount_total'  // champion_donor
  | 'impact_score'           // top_contributor
  | 'join_date'              // founding_member (date-based)
  | 'role'                   // leader (role-based)

export interface BadgeCriteria {
  metric: BadgeMetric
  /** Numeric target for progress-bar badges. null for binary badges. */
  target: number | null
  /** True if the badge is earned by a date/role check, not a number. */
  binary: boolean
}

export const BADGE_CRITERIA: Record<BadgeType, BadgeCriteria> = {
  founding_member:   { metric: 'join_date',              target: null,    binary: true },
  active_member:     { metric: 'points',                 target: 50,      binary: false },
  event_hero:        { metric: 'events_attended',        target: 10,      binary: false },
  volunteer:         { metric: 'tasks_completed',        target: 1,       binary: false },
  leader:            { metric: 'role',                   target: null,    binary: true },
  champion_donor:    { metric: 'donation_amount_total',  target: 10000,   binary: false },
  top_contributor:   { metric: 'impact_score',           target: 500,     binary: false },
}

// ---------------------------------------------------------------------------
// Metrics bundle — everything syncMemberBadges needs in one fetch.
// ---------------------------------------------------------------------------
export interface MemberMetrics {
  userId: string
  createdAt: string
  role: string
  tier: MembershipTier
  eventsAttended: number
  tasksCompleted: number
  commentsMade: number
  donationsMade: number
  donationAmountTotal: number
  points: number
  badgesEarned: number
  impactScore: number
}

/**
 * Fetches all the data needed to evaluate badge criteria and compute
 * impact score for a single member. Returns null if the profile doesn't
 * exist (e.g. not yet provisioned).
 */
export async function fetchMemberMetrics(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberMetrics | null> {
  const [profileRes, impactRes, badgesRes] = await Promise.all([
    supabase.from('profiles').select('created_at, role, tier').eq('id', userId).single(),
    supabase.from('member_impact_scores').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('member_badges').select('badge_type').eq('user_id', userId),
  ])

  if (!profileRes.data) return null

  const impact = impactRes.data as {
    events_attended: number; tasks_completed: number; comments_made: number
    donations_made: number; donation_amount_total: number; total_score: number
  } | null

  const eventsAttended       = impact?.events_attended ?? 0
  const tasksCompleted       = impact?.tasks_completed ?? 0
  const commentsMade         = impact?.comments_made ?? 0
  const donationsMade        = impact?.donations_made ?? 0
  const donationAmountTotal  = impact?.donation_amount_total ?? 0
  const points               = impact?.total_score ?? 0
  const badgesEarned         = badgesRes.data?.length ?? 0
  const impactScore          = computeImpactScore(points, donationAmountTotal, badgesEarned)

  return {
    userId,
    createdAt: profileRes.data.created_at,
    role: profileRes.data.role,
    tier: profileRes.data.tier as MembershipTier,
    eventsAttended, tasksCompleted, commentsMade, donationsMade,
    donationAmountTotal, points, badgesEarned, impactScore,
  }
}

// ---------------------------------------------------------------------------
// Thresholds — read from site_settings with canonical defaults.
// ---------------------------------------------------------------------------
export interface Thresholds {
  foundingCutoff: string
  activeMember: number
  eventHero: number
  championDonor: number
  topContributor: number
}

export async function fetchThresholds(supabase: SupabaseClient): Promise<Thresholds> {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'founding_member_cutoff', 'active_member_threshold', 'event_hero_threshold',
      'champion_donor_threshold', 'top_contributor_threshold',
    ])

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return {
    foundingCutoff:   (map.founding_member_cutoff ?? '2025-12-31').trim(),
    activeMember:     Number(map.active_member_threshold ?? 50) || 50,
    eventHero:        Number(map.event_hero_threshold ?? 10) || 10,
    championDonor:    Number(map.champion_donor_threshold ?? 10000) || 10000,
    topContributor:   Number(map.top_contributor_threshold ?? 500) || 500,
  }
}

/**
 * Evaluates whether a single badge should be earned given the member's
 * metrics and the configured thresholds.
 */
function badgeIsEarned(type: BadgeType, m: MemberMetrics, t: Thresholds): boolean {
  switch (type) {
    case 'founding_member':
      // Joined on or before the founding cutoff date — not point-based.
      return new Date(m.createdAt) <= new Date(t.foundingCutoff + 'T23:59:59')
    case 'active_member':
      return m.points >= t.activeMember
    case 'event_hero':
      return m.eventsAttended >= t.eventHero
    case 'volunteer':
      return m.tasksCompleted >= 1
    case 'leader':
      // Verified leadership = admin role (admins are vetted). Not point-based.
      return m.role === 'admin'
    case 'champion_donor':
      // Verified giving by total amount, not donation count.
      return m.donationAmountTotal >= t.championDonor
    case 'top_contributor':
      return m.impactScore >= t.topContributor
    default:
      return false
  }
}

export interface BadgeSyncResult {
  newlyAwarded: BadgeType[]
  allEarned: BadgeType[]
}

/**
 * Checks every badge criterion against the member's current metrics and
 * upserts any newly-earned badges into member_badges. Each newly-earned
 * badge triggers an in-app notification. Existing badges are left in place
 * (their awarded_at is preserved). Never throws — failures are logged.
 *
 * This is the single source of truth for automatic badge unlocking. Admins
 * can still manually award/revoke via app/actions/achievements.ts; this
 * function only adds badges, it never removes them.
 */
export async function syncMemberBadges(
  supabase: SupabaseClient,
  userId: string,
): Promise<BadgeSyncResult> {
  try {
    const metrics = await fetchMemberMetrics(supabase, userId)
    if (!metrics) return { newlyAwarded: [], allEarned: [] }

    const thresholds = await fetchThresholds(supabase)
    const allTypes = Object.keys(BADGE_META) as BadgeType[]

    // Fetch currently-earned badge types
    const { data: existing } = await supabase
      .from('member_badges')
      .select('badge_type')
      .eq('user_id', userId)
    const earnedSet = new Set((existing ?? []).map((b) => b.badge_type as BadgeType))

    const newlyAwarded: BadgeType[] = []
    for (const type of allTypes) {
      if (earnedSet.has(type)) continue
      if (badgeIsEarned(type, metrics, thresholds)) newlyAwarded.push(type)
    }

    // Upsert new badges (awarded_by = null = system-awarded)
    if (newlyAwarded.length) {
      const rows = newlyAwarded.map((badge_type) => ({
        user_id: userId,
        badge_type,
        awarded_by: null,
        notes: 'Auto-awarded by achievement system',
      }))

      const { error } = await supabase
        .from('member_badges')
        .upsert(rows, { onConflict: 'user_id,badge_type', ignoreDuplicates: true })

      if (error) {
        console.error('[achievements] badge upsert failed:', error.message)
      } else {
        // Notify the member about each new badge
        const notifications = newlyAwarded.map((badge_type) => ({
          user_id: userId,
          type: 'badge' as const,
          title: `${BADGE_META[badge_type]?.emoji ?? '🏅'} New badge: ${BADGE_META[badge_type]?.label ?? badge_type}`,
          body: `You've earned the ${BADGE_META[badge_type]?.label ?? badge_type} badge!`,
          link: '/dashboard/achievements',
        }))
        await supabase.from('notifications').insert(notifications).then(() => {})
      }
    }

    return {
      newlyAwarded,
      allEarned: [...Array.from(earnedSet), ...newlyAwarded],
    }
  } catch (err) {
    console.error('[achievements] syncMemberBadges error:', err)
    return { newlyAwarded: [], allEarned: [] }
  }
}

// ---------------------------------------------------------------------------
// Progress — for the "progress toward next achievement" UI.
// ---------------------------------------------------------------------------
export interface BadgeProgress {
  type: BadgeType
  earned: boolean
  /** Current value of the tracked metric (null for binary badges). */
  current: number | null
  /** Target value (null for binary badges). */
  target: number | null
  /** 0–1 progress fraction (1 if earned or binary). */
  pct: number
  /** Human-readable status line, e.g. "3 of 10 events". */
  statusText: string
}

/**
 * Computes progress for every badge so the UI can render progress bars.
 * Thresholds are read from site_settings; pass them in to avoid a second
 * fetch when the page already loaded them.
 */
export function computeBadgeProgress(
  metrics: MemberMetrics,
  earnedTypes: Set<BadgeType>,
  thresholds: Thresholds,
): BadgeProgress[] {
  const allTypes = Object.keys(BADGE_META) as BadgeType[]

  return allTypes.map((type) => {
    const criteria = BADGE_CRITERIA[type]
    const earned = earnedTypes.has(type)

    if (criteria.binary) {
      return {
        type, earned, current: null, target: null, pct: earned ? 1 : 0,
        statusText: binaryStatus(type, metrics, thresholds, earned),
      }
    }

    // Numeric progress badge
    const target = numericTarget(type, thresholds)
    const current = numericCurrent(type, metrics)
    const pct = target > 0 ? Math.min(current / target, 1) : 0

    return {
      type, earned, current, target,
      pct: earned ? 1 : pct,
      statusText: `${current} of ${target} ${metricLabel(type)}`,
    }
  })
}

function numericTarget(type: BadgeType, t: Thresholds): number {
  switch (type) {
    case 'active_member':    return t.activeMember
    case 'event_hero':       return t.eventHero
    case 'volunteer':        return 1
    case 'champion_donor':   return t.championDonor
    case 'top_contributor':  return t.topContributor
    default:                 return 0
  }
}

function numericCurrent(type: BadgeType, m: MemberMetrics): number {
  switch (type) {
    case 'active_member':    return m.points
    case 'event_hero':       return m.eventsAttended
    case 'volunteer':        return m.tasksCompleted
    case 'champion_donor':   return m.donationAmountTotal
    case 'top_contributor':  return m.impactScore
    default:                 return 0
  }
}

function metricLabel(type: BadgeType): string {
  switch (type) {
    case 'active_member':    return 'points'
    case 'event_hero':       return 'events'
    case 'volunteer':        return 'task'
    case 'champion_donor':   return 'KES given'
    case 'top_contributor':  return 'impact score'
    default:                 return ''
  }
}

function binaryStatus(
  type: BadgeType,
  m: MemberMetrics,
  t: Thresholds,
  earned: boolean,
): string {
  if (type === 'founding_member') {
    if (earned) return 'Founding cohort'
    const joined = new Date(m.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })
    return `Joined ${joined} (after founding cohort)`
  }
  if (type === 'leader') {
    return earned ? 'Verified leadership role' : 'Admin role required'
  }
  return earned ? 'Earned' : 'Locked'
}

// ---------------------------------------------------------------------------
// Leaderboard position — "top X%" among approved members.
// Uses total_score (points) from the view as a stable cross-member metric.
// ---------------------------------------------------------------------------
export interface LeaderboardPosition {
  rank: number       // 1-based position (1 = highest)
  total: number      // total approved members with any activity
  percentile: number // top N% (e.g. 10 = top 10%)
}

export async function fetchLeaderboardPosition(
  supabase: SupabaseClient,
  userId: number | string,
  userScore: number,
): Promise<LeaderboardPosition | null> {
  // Count approved members with a strictly higher score.
  const { count: higher } = await supabase
    .from('member_impact_scores')
    .select('*', { count: 'exact', head: true })
    .gt('total_score', userScore)

  // Total members with any activity (score > 0) — a meaningful denominator.
  const { count: total } = await supabase
    .from('member_impact_scores')
    .select('*', { count: 'exact', head: true })
    .gt('total_score', 0)

  if (total === null || total === 0) return null

  const rank = (higher ?? 0) + 1
  const percentile = Math.round((rank / total) * 100)
  return { rank, total, percentile }
}
