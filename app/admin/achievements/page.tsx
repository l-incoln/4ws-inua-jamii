import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { computeImpactScore, computeRank, RANK_TIERS } from '@/lib/achievements'
import { BADGE_META } from '@/lib/badge-meta'
import type { BadgeType } from '@/types'
import { Trophy, Download, Star, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Achievement Reports | Admin' }

interface MemberRow {
  id: string
  full_name: string | null
  email: string | null
  tier: string
  role: string
  created_at: string
  eventsAttended: number
  tasksCompleted: number
  commentsMade: number
  donationsMade: number
  donationTotal: number
  points: number
  badges: string[]
  impactScore: number
  rankName: string
  rankGradient: string
  rankEmoji: string
}

export default async function AdminAchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all approved members with their impact scores + badges
  const [membersRes, impactRes, badgesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, tier, role, created_at')
      .eq('membership_status', 'approved')
      .order('created_at', { ascending: false }),
    supabase.from('member_impact_scores').select('*'),
    supabase.from('member_badges').select('user_id, badge_type, awarded_at'),
  ])

  const impactMap = new Map((impactRes.data ?? []).map((r) => [r.user_id, r]))
  const badgeMap = new Map<string, string[]>()
  for (const b of badgesRes.data ?? []) {
    const arr = badgeMap.get(b.user_id) ?? []
    arr.push(b.badge_type)
    badgeMap.set(b.user_id, arr)
  }

  const allBadgeTypes = Object.keys(BADGE_META) as BadgeType[]

  const members: MemberRow[] = (membersRes.data ?? []).map((m) => {
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

    return {
      id: m.id, full_name: m.full_name, email: m.email, tier: m.tier, role: m.role,
      created_at: m.created_at,
      eventsAttended, tasksCompleted, commentsMade, donationsMade, donationTotal,
      points, badges: userBadges, impactScore,
      rankName: rank.current.name, rankGradient: rank.current.gradient, rankEmoji: rank.current.emoji,
    }
  })

  // Sort by impact score descending
  members.sort((a, b) => b.impactScore - a.impactScore)

  // Summary stats
  const totalMembers = members.length
  const totalPoints = members.reduce((s, m) => s + m.points, 0)
  const totalImpact = members.reduce((s, m) => s + m.impactScore, 0)
  const totalBadges = members.reduce((s, m) => s + m.badges.length, 0)
  const totalDonations = members.reduce((s, m) => s + m.donationTotal, 0)

  // Rank distribution
  const rankDistribution = RANK_TIERS.map((tier) => ({
    name: tier.name, emoji: tier.emoji, gradient: tier.gradient,
    count: members.filter((m) => m.rankName === tier.name).length,
  }))

  // Badge distribution
  const badgeDistribution = allBadgeTypes.map((type) => ({
    type, meta: BADGE_META[type],
    count: members.filter((m) => m.badges.includes(type)).length,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Achievement Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Member points, impact scores, ranks, and badges across the foundation</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export/achievements" className="btn-primary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Achievements CSV
          </a>
          <a href="/api/admin/export/impact" className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Impact CSV
          </a>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600">{totalPoints.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total Points</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600">{totalImpact.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total Impact Score</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-violet-600">{totalBadges}</div>
            <div className="text-xs text-slate-500">Badges Awarded</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-600">KES {totalDonations.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total Donated</div>
          </div>
        </div>
      </div>

      {/* Rank + Badge distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rank distribution */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4">Rank Distribution</h2>
          <div className="space-y-3">
            {rankDistribution.slice().reverse().map((r) => {
              const pct = totalMembers > 0 ? (r.count / totalMembers) * 100 : 0
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${r.gradient} rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
                    {r.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{r.name}</span>
                      <span className="text-slate-500">{r.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${r.gradient} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badge distribution */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4">Badge Distribution</h2>
          <div className="space-y-2.5">
            {badgeDistribution.map(({ type, meta, count }) => {
              const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 0
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="text-xl flex-shrink-0">{meta.emoji}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{meta.label}</span>
                      <span className="text-slate-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Member Leaderboard</h2>
          <span className="text-xs text-slate-400">{members.length} approved members</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 pr-3">#</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3 text-center">Points</th>
                <th className="pb-3 pr-3 text-center">Impact</th>
                <th className="pb-3 pr-3">Rank</th>
                <th className="pb-3 pr-3 text-center">Events</th>
                <th className="pb-3 pr-3 text-center">Tasks</th>
                <th className="pb-3 pr-3 text-center">Donations</th>
                <th className="pb-3 pr-3 text-center">KES Given</th>
                <th className="pb-3">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No approved members yet.</td>
                </tr>
              ) : members.map((m, i) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="py-3 pr-3 text-slate-400 font-medium">{i + 1}</td>
                  <td className="py-3 pr-3">
                    <Link href={`/admin/members`} className="font-medium text-slate-900 hover:text-primary-600">
                      {m.full_name ?? 'Unknown'}
                    </Link>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </td>
                  <td className="py-3 pr-3 text-center font-semibold text-amber-600">{m.points}</td>
                  <td className="py-3 pr-3 text-center font-semibold text-emerald-600">{m.impactScore}</td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center gap-1 bg-gradient-to-r ${m.rankGradient} text-white px-2 py-0.5 rounded-full text-xs font-semibold`}>
                      {m.rankEmoji} {m.rankName}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-center text-slate-600">{m.eventsAttended}</td>
                  <td className="py-3 pr-3 text-center text-slate-600">{m.tasksCompleted}</td>
                  <td className="py-3 pr-3 text-center text-slate-600">{m.donationsMade}</td>
                  <td className="py-3 pr-3 text-center text-slate-600">{m.donationTotal.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex gap-0.5 flex-wrap max-w-[120px]">
                      {m.badges.length === 0 ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : m.badges.slice(0, 5).map((b) => (
                        <span key={b} title={BADGE_META[b]?.label}>{BADGE_META[b]?.emoji}</span>
                      ))}
                      {m.badges.length > 5 && <span className="text-xs text-slate-400">+{m.badges.length - 5}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
