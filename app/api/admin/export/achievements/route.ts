import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeImpactScore, computeRank, RANK_TIERS } from '@/lib/achievements'
import { BADGE_META } from '@/lib/badge-meta'
import type { BadgeType } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all approved members with their impact scores + badges in parallel
  const [membersRes, impactRes, badgesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, tier, membership_status, role, created_at')
      .eq('membership_status', 'approved')
      .order('created_at', { ascending: false }),
    supabase
      .from('member_impact_scores')
      .select('*'),
    supabase
      .from('member_badges')
      .select('user_id, badge_type, awarded_at'),
  ])

  if (membersRes.error) return NextResponse.json({ error: membersRes.error.message }, { status: 500 })

  const impactMap = new Map((impactRes.data ?? []).map((r) => [r.user_id, r]))
  const badgeMap = new Map<string, string[]>()
  for (const b of badgesRes.data ?? []) {
    const arr = badgeMap.get(b.user_id) ?? []
    arr.push(b.badge_type)
    badgeMap.set(b.user_id, arr)
  }

  const allBadgeTypes = Object.keys(BADGE_META) as BadgeType[]

  const headers = [
    'Name', 'Email', 'Tier', 'Role', 'Joined',
    'Events Attended', 'Tasks Completed', 'Comments Made', 'Donations Made',
    'Donation Total (KES)', 'Points', 'Impact Score', 'Rank',
    ...allBadgeTypes.map((t) => BADGE_META[t].label),
    'Total Badges',
  ]

  const rows = (membersRes.data ?? []).map((m) => {
    const impact = impactMap.get(m.id)
    const eventsAttended = impact?.events_attended ?? 0
    const tasksCompleted = impact?.tasks_completed ?? 0
    const commentsMade = impact?.comments_made ?? 0
    const donationsMade = impact?.donations_made ?? 0
    const donationTotal = impact?.donation_amount_total ?? 0
    const points = impact?.total_score ?? 0
    const userBadges = badgeMap.get(m.id) ?? []
    const impactScore = computeImpactScore(points, donationTotal, userBadges.length)
    const rank = computeRank(impactScore)

    return [
      m.full_name ?? '',
      m.email ?? '',
      m.tier,
      m.role,
      new Date(m.created_at).toLocaleDateString('en-KE'),
      eventsAttended,
      tasksCompleted,
      commentsMade,
      donationsMade,
      donationTotal,
      points,
      impactScore,
      rank.current.name,
      ...allBadgeTypes.map((t) => userBadges.includes(t) ? 'Yes' : 'No'),
      userBadges.length,
    ]
  })

  // Sort by impact score descending
  rows.sort((a, b) => Number(b[11]) - Number(a[11]))

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="achievements-${date}.csv"`,
    },
  })
}
