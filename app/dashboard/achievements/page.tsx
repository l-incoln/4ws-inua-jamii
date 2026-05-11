import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { MemberBadge, ImpactScore } from '@/types'
import { BADGE_META } from '@/lib/badge-meta'
import { Trophy, Star, Zap, TrendingUp, CalendarCheck, CheckSquare, MessageSquare, Heart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Achievements | Dashboard' }

function ScoreRing({ score, max = 500 }: { score: number; max?: number }) {
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
        <p className="text-xs text-slate-400 mt-0.5 font-medium">points</p>
      </div>
    </div>
  )
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch impact score from the view
  const { data: impactRaw } = await supabase
    .from('member_impact_scores')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const impact: ImpactScore = impactRaw ?? {
    user_id: user.id,
    full_name: null,
    events_attended: 0,
    tasks_completed: 0,
    comments_made: 0,
    donations_made: 0,
    total_score: 0,
  }

  // Fetch badges
  const { data: badgesRaw } = await supabase
    .from('member_badges')
    .select('*')
    .eq('user_id', user.id)
    .order('awarded_at', { ascending: false })

  const badges: MemberBadge[] = badgesRaw ?? []
  const earnedTypes = new Set(badges.map((b) => b.badge_type))

  // Compute rank
  const score = impact.total_score
  const rank = score >= 300 ? 'Gold' : score >= 150 ? 'Silver' : score >= 50 ? 'Bronze' : 'Starter'
  const rankColors: Record<string, string> = {
    Gold: 'from-amber-400 to-orange-500',
    Silver: 'from-slate-400 to-slate-500',
    Bronze: 'from-orange-400 to-red-400',
    Starter: 'from-blue-400 to-cyan-500',
  }

  const activityStats = [
    { label: 'Events Attended', value: impact.events_attended, icon: CalendarCheck, pts: 10, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tasks Completed', value: impact.tasks_completed, icon: CheckSquare,   pts: 15, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Comments Made',   value: impact.comments_made,   icon: MessageSquare, pts: 2,  color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Donations Made',  value: impact.donations_made,  icon: Heart,         pts: 20, color: 'text-rose-600',   bg: 'bg-rose-50' },
  ]

  const allBadgeTypes = Object.keys(BADGE_META) as import('@/types').BadgeType[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
        <p className="text-slate-500 text-sm mt-1">Your badges, impact score, and activity record</p>
      </div>

      {/* Impact Score + Rank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Score ring */}
        <div className="card p-6 flex flex-col items-center justify-center gap-3">
          <ScoreRing score={score} />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Impact Score</p>
            <p className="text-xs text-slate-400 mt-0.5">Based on your foundation activity</p>
          </div>
        </div>

        {/* Rank + breakdown */}
        <div className="card p-6 flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Rank</p>
            <div className={`mt-2 inline-flex items-center gap-2 bg-gradient-to-r ${rankColors[rank]} text-white px-4 py-1.5 rounded-full font-bold text-lg shadow-md`}>
              <Trophy className="w-5 h-5" />
              {rank}
            </div>
          </div>
          <div className="space-y-1.5">
            {activityStats.map(({ label, value, pts, color }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">
                  {value} × {pts} = <span className={`${color} font-bold`}>{value * pts} pts</span>
                </span>
              </div>
            ))}
            <div className="pt-1 border-t border-slate-100 flex justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-emerald-600">{score} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activityStats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Badges</h2>
          <span className="text-xs text-slate-400">{badges.length}/{allBadgeTypes.length} earned</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allBadgeTypes.map((type) => {
            const meta = BADGE_META[type]
            const earned = earnedTypes.has(type)
            const badge = badges.find((b) => b.badge_type === type)
            return (
              <div
                key={type}
                className={`rounded-2xl p-4 border transition-all ${
                  earned
                    ? `${meta.color} border`
                    : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                }`}
              >
                <div className="text-2xl mb-1">{meta.emoji}</div>
                <p className="font-semibold text-sm">{meta.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{meta.description}</p>
                {earned && badge && (
                  <p className="text-[10px] mt-2 opacity-60">
                    Earned {new Date(badge.awarded_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                  </p>
                )}
                {!earned && (
                  <p className="text-[10px] mt-2 opacity-60">Not yet earned</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Ranking guide */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm">How Points Work</h2>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div>Event attendance = 10 pts each</div>
          <div>Volunteer task completed = 15 pts each</div>
          <div>Blog comment approved = 2 pts each</div>
          <div>Donation made = 20 pts each</div>
        </div>
        <div className="flex gap-2 flex-wrap text-xs">
          {Object.entries(rankColors).reverse().map(([r, grad]) => (
            <span key={r} className={`bg-gradient-to-r ${grad} text-white px-2.5 py-1 rounded-full font-semibold`}>
              {r === 'Gold' ? '300+' : r === 'Silver' ? '150+' : r === 'Bronze' ? '50+' : '0+'} pts → {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
