import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarCheck, Bell, ArrowRight, Users, Heart, Star } from 'lucide-react'
import { getTierStyle } from '@/lib/tier-colors'
import AwarenessGreeting from '@/components/awareness/AwarenessGreeting'
import BirthdayCelebration from '@/components/dashboard/BirthdayCelebration'
import { getAwarenessDaysForDate, getUpcomingAwarenessDays } from '@/lib/awareness'
import { isBirthdayOn, todayInZone } from '@/lib/birthdays'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Member Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const todayIso = todayInZone()
  const [todayMonth, todayDay] = todayIso.split('-').slice(1).map(Number)

  // Fetch real stats and announcements in parallel
  const [rsvpRes, donationRes, profileRes, announcementsRes, awarenessRes, myBirthdayRes, communityBirthdaysRes] = await Promise.all([
    supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'confirmed'),
    supabase
      .from('donations')
      .select('id', { count: 'exact', head: true })
      .eq('donor_id', user.id),
    supabase
      .from('profiles')
      .select('created_at, tier, membership_status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('announcements')
      .select('id, title, body, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('awareness_days')
      .select('id, name, description, month, day, specific_date, category, priority, icon_emoji, theme_color, banner_message, link_url, link_label, is_active')
      .eq('is_active', true),
    // RLS restricts this to the member's own row
    supabase
      .from('member_birthdays')
      .select('birth_date, receive_greetings')
      .eq('user_id', user.id)
      .maybeSingle(),
    // Opted-in members only; the view exposes day + month, never the year
    supabase
      .from('public_birthdays')
      .select('user_id, full_name, avatar_url')
      .eq('birth_month', todayMonth)
      .eq('birth_day', todayDay),
  ])

  const eventsAttended = rsvpRes.count ?? 0
  const donationsMade = donationRes.count ?? 0
  const memberSince = profileRes.data?.created_at || user.created_at
  const membershipDays = Math.floor((Date.now() - new Date(memberSince).getTime()) / 86400000)

  const tier = profileRes.data?.tier ?? 'basic'
  const tierStyle = getTierStyle(tier)
  const tierLabel = tierStyle.label
  const isApproved = profileRes.data?.membership_status === 'approved'

  const announcements = announcementsRes.data ?? []

  const myBirthday = myBirthdayRes.data
  const isMyBirthday = !!myBirthday?.receive_greetings && isBirthdayOn(myBirthday.birth_date as string, todayIso)
  const communityBirthdays = (communityBirthdaysRes.data ?? []).filter((m) => m.user_id !== user.id)

  const today = new Date()
  const todayAwarenessDays    = getAwarenessDaysForDate(awarenessRes.data ?? [], today)
  const upcomingAwarenessDays = getUpcomingAwarenessDays(awarenessRes.data ?? [], today, 7)

  const quickStats = [
    { label: 'Events Attended', value: String(eventsAttended), icon: CalendarCheck, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Donations Made', value: String(donationsMade), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Member Since', value: membershipDays < 365 ? `${membershipDays}d` : `${Math.floor(membershipDays / 365)}yr`, icon: Star, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Tier', value: tierLabel.replace(' Member', ''), icon: Users, color: tierStyle.text, bg: tierStyle.lightBg },
  ]

  const displayName = user.user_metadata?.full_name?.split(' ')[0] || 'Member'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-hero-gradient rounded-3xl p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-primary-200 text-sm font-medium">{greeting},</p>
          <h1 className="text-3xl font-extrabold mt-0.5">{displayName} 👋</h1>
          <p className="text-primary-100 text-sm mt-2 max-w-md">
            Welcome to your member dashboard. Track your impact, manage your events, and stay connected.
          </p>
          <div className="mt-5 flex items-center gap-1 flex-wrap">
            <span className="badge bg-white/10 text-white border border-white/20 text-xs">{tierLabel}</span>
            {!isApproved && (
              <>
                <span className="text-xs text-primary-300 mx-2">·</span>
                <span className="text-xs text-amber-300">Pending approval</span>
              </>
            )}
            <span className="text-xs text-primary-300 mx-2">·</span>
            <Link href="/dashboard/profile" className="text-xs text-primary-200 hover:text-white underline-offset-2 hover:underline">
              View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Birthdays */}
      <BirthdayCelebration
        isMyBirthday={isMyBirthday}
        memberName={displayName}
        others={communityBirthdays}
      />

      {/* Awareness greeting */}
      <AwarenessGreeting
        todayDays={todayAwarenessDays}
        upcomingDays={upcomingAwarenessDays}
        memberName={displayName}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-slate-900">Announcements</h2>
            </div>
            <Link href="/dashboard/feed" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No announcements yet.</p>
            ) : announcements.map((a) => (
              <div key={a.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                {a.is_pinned && (
                  <span className="badge-green text-xs mt-0.5 shrink-0">Pinned</span>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                  {a.body && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.body}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(a.created_at).toLocaleDateString('en-KE', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2.5">
              {[
                { label: 'RSVP for an Event', href: '/events', color: 'btn-primary' },
                { label: 'Make a Donation', href: '/donate', color: 'btn-sky' },
                { label: 'Membership Card', href: '/dashboard/membership-card', color: 'btn-secondary' },
                { label: 'Update My Profile', href: '/dashboard/profile', color: 'btn-secondary' },
              ].map(({ label, href, color }) => (
                <Link key={label} href={href} className={`${color} w-full justify-center text-sm`}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-primary-50 border-primary-100">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Upgrade Your Membership</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Get full access to all programs, exclusive events, and community features.
            </p>
            <Link href="/contact" className="btn-primary text-sm w-full justify-center">
              Contact Us to Upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

