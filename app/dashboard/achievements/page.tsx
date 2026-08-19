import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { MemberBadge, BadgeType } from '@/types'
import { BADGE_META } from '@/lib/badge-meta'
import {
  computeRank, computeImpactScore, fetchMemberMetrics, fetchThresholds,
  computeBadgeProgress, fetchLeaderboardPosition, RANK_TIERS,
} from '@/lib/achievements'
import { syncMemberBadges } from '@/app/actions/achievements'
import { Trophy, Star, Zap, TrendingUp, CalendarCheck, CheckSquare, MessageSquare, Heart, ArrowRight, Sparkles } from 'lucide-react'
import BackLink from '@/components/dashboard/BackLink'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Achievements | Dashboard' }

function ScoreRing({ score, max = 1000, label }: { score: number; max?: number; label: string }) {
  const pct = Math.min(score / max, 1)
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-3xl font-black text-slate-900 leading-none">{score}</p>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  )
}

function ProgressBar({ pct, color = 'bg-primary-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.round(pct * 100)}%` }}
      />
    </div>
  )
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Auto-unlock any newly-earned badges before rendering, so the page is
  // always current. Best-effort — never blocks the page on failure.
  await syncMemberBadges(user.id)

  // Fetch everything in parallel after the sync (so badge counts are fresh).
  const [metrics, thresholds] = await Promise.all([
    fetchMemberMetrics(supabase, user.id),
    fetchThresholds(supabase),
  ])

  if (!metrics) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="card p-8 text-center">
          <p className="text-slate-500">Your profile is still being set up. Please check back shortly.</p>
        </div>
      </div>
    )
  }

  // Fetch badges (after sync so new ones appear) + leaderboard position.
  const [badgesRes, leaderboard] = await Promise.all([
    supabase.from('member_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false }),
    fetchLeaderboardPosition(supabase, user.id, metrics.points),
  ])

  const badges: MemberBadge[] = badgesRes.data ?? []
  const earnedTypes = new Set(badges.map((b) => b.badge_type))

  // Recompute impact score with the post-sync badge count (sync may have added badges).
  const impactScore = computeImpactScore(metrics.points, metrics.donationAmountTotal, badges.length)
  const rank = computeRank(impactScore)
  const badgeProgress = computeBadgeProgress(metrics, earnedTypes, thresholds)

  const activityStats = [
    { label: 'Events Attended', value: metrics.eventsAttended, icon: CalendarCheck, pts: 10, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tasks Completed', value: metrics.tasksCompleted, icon: CheckSquare,   pts: 15, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Comments Made',   value: metrics.commentsMade,   icon: MessageSquare, pts: 2,  color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Donations Made',  value: metrics.donationsMade,  icon: Heart,         pts: 20, color: 'text-rose-600',   bg: 'bg-rose-50' },
  ]

  const recentAchievements = badges.slice(0, 5)
  const allBadgeTypes = Object.keys(BADGE_META) as BadgeType[]

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
          <p className="text-slate-500 text-sm mt-1">Your points, impact score, rank, and badges</p>
        </div>
        <Link href="/dashboard" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Impact Score + Points + Rank */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Impact Score ring */}
        <div className="card p-6 flex flex-col items-center justify-center gap-3">
          <ScoreRing score={impactScore} label="impact" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Impact Score
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Reflects the level &amp; meaning of your contribution</p>
          </div>
        </div>

        {/* Points */}
        <div className="card p-6 flex flex-col items-center justify-center gap-3">
          <div className="w-36 h-36 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-black text-slate-900 leading-none">{metrics.points}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">points</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-500" /> Points
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Earned from verified activity</p>
          </div>
        </div>

        {/* Rank + progress to next */}
        <div className="card p-6 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Rank</p>
            <div className={`mt-2 inline-flex items-center gap-2 bg-gradient-to-r ${rank.current.gradient} text-white px-4 py-1.5 rounded-full font-bold text-lg shadow-md`}>
              <span>{rank.current.emoji}</span>
              {rank.current.name}
            </div>
            {leaderboard && (
              <p className="text-xs text-slate-500 mt-2">
                Position #{leaderboard.rank} of {leaderboard.total} active members (top {leaderboard.percentile}%)
              </p>
            )}
          </div>
          {rank.next ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress to {rank.next.name} {rank.next.emoji}</span>
                <span className="font-semibold">{rank.toNext} to go</span>
              </div>
              <ProgressBar pct={rank.progress} color="bg-gradient-to-r from-amber-400 to-orange-500" />
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Highest rank achieved!
            </p>
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activityStats.map(({ label, value, icon: Icon, pts, color, bg }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{pts} pts each</p>
          </div>
        ))}
      </div>

      {/* Impact score breakdown */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500" /> How Your Impact Score Is Calculated
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="font-semibold text-slate-700">Activity Points</p>
            <p className="text-slate-500 mt-0.5">{metrics.points} pts from events, tasks, comments &amp; donations</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-3">
            <p className="font-semibold text-rose-700">Giving Bonus</p>
            <p className="text-rose-500 mt-0.5">+{Math.floor(metrics.donationAmountTotal / 1000)} from KES {metrics.donationAmountTotal.toLocaleString()} donated</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="font-semibold text-amber-700">Breadth Bonus</p>
            <p className="text-amber-500 mt-0.5">+{badges.length * 10} from {badges.length} badges earned</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
          <span className="text-slate-700">Total Impact Score</span>
          <span className="text-emerald-600">{impactScore}</span>
        </div>
      </div>

      {/* Badges with progress */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Badges</h2>
          <span className="text-xs text-slate-400">{badges.length}/{allBadgeTypes.length} earned</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badgeProgress.map((bp) => {
            const meta = BADGE_META[bp.type]
            const badge = badges.find((b) => b.badge_type === bp.type)
            return (
              <div
                key={bp.type}
                className={`rounded-2xl p-4 border transition-all ${
                  bp.earned ? `${meta.color} border` : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${bp.earned ? '' : 'grayscale opacity-50'}`}>{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{meta.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{meta.description}</p>
                    {bp.earned && badge ? (
                      <p className="text-[10px] mt-2 opacity-60">
                        Earned {new Date(badge.awarded_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                      </p>
                    ) : (
                      <>
                        <p className="text-[10px] mt-2 opacity-60">{bp.statusText}</p>
                        {bp.target !== null && (
                          <div className="mt-1.5">
                            <ProgressBar pct={bp.pct} color="bg-primary-400" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent achievements feed */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Recent Achievements
        </h2>
        {recentAchievements.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm text-slate-500">No badges earned yet.</p>
            <p className="text-xs text-slate-400 mt-1">RSVP for events, complete volunteer tasks, or make a donation to start earning badges!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAchievements.map((badge) => {
              const meta = BADGE_META[badge.badge_type]
              return (
                <div key={badge.id} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="text-2xl">{meta.emoji}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                    <p className="text-xs text-slate-500">{meta.description}</p>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(badge.awarded_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Points guide */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm">How Points &amp; Ranks Work</h2>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div>Event attendance = 10 pts each</div>
          <div>Volunteer task completed = 15 pts each</div>
          <div>Blog comment approved = 2 pts each</div>
          <div>Donation made = 20 pts each</div>
        </div>
        <div className="flex gap-2 flex-wrap text-xs pt-1">
          {[...RANK_TIERS].reverse().map((tier) => (
            <span key={tier.name} className={`bg-gradient-to-r ${tier.gradient} text-white px-2.5 py-1 rounded-full font-semibold`}>
              {tier.emoji} {tier.min}+ → {tier.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400 pt-1">
          Impact Score = points + giving bonus (KES 1,000 = +1) + breadth bonus (10 per badge). Rank is based on Impact Score.
        </p>
      </div>
    </div>
  )
}
