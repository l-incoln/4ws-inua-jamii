import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeImpactScore, computeRank } from '@/lib/achievements'

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

  // Fetch impact scores + badge counts + profiles in parallel
  const [impactRes, badgeCountRes, profilesRes] = await Promise.all([
    supabase.from('member_impact_scores').select('*'),
    supabase.from('member_badges').select('user_id'),
    supabase.from('profiles')
      .select('id, full_name, email, tier, membership_status, created_at')
      .order('created_at', { ascending: false }),
  ])

  if (impactRes.error) return NextResponse.json({ error: impactRes.error.message }, { status: 500 })

  const badgeCounts = new Map<string, number>()
  for (const b of badgeCountRes.data ?? []) {
    badgeCounts.set(b.user_id, (badgeCounts.get(b.user_id) ?? 0) + 1)
  }

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))

  const headers = [
    'Name', 'Email', 'Tier', 'Membership Status', 'Joined',
    'Events Attended', 'Tasks Completed', 'Comments Made', 'Donations Made',
    'Donation Total (KES)', 'Points', 'Badges Earned', 'Impact Score', 'Rank',
  ]

  const rows = (impactRes.data ?? []).map((r) => {
    const p = profileMap.get(r.user_id)
    const badgeCount = badgeCounts.get(r.user_id) ?? 0
    const points = r.total_score ?? 0
    const donationTotal = r.donation_amount_total ?? 0
    const impactScore = computeImpactScore(points, donationTotal, badgeCount)
    const rank = computeRank(impactScore)

    return [
      p?.full_name ?? r.full_name ?? '',
      p?.email ?? '',
      p?.tier ?? '',
      p?.membership_status ?? '',
      p ? new Date(p.created_at).toLocaleDateString('en-KE') : '',
      r.events_attended ?? 0,
      r.tasks_completed ?? 0,
      r.comments_made ?? 0,
      r.donations_made ?? 0,
      donationTotal,
      points,
      badgeCount,
      impactScore,
      rank.current.name,
    ]
  })

  // Sort by impact score descending
  rows.sort((a, b) => Number(b[12]) - Number(a[12]))

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="impact-report-${date}.csv"`,
    },
  })
}
