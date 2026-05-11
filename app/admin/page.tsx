import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, CalendarDays, Heart, FileText, TrendingUp, AlertCircle, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Admin Overview' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: memberCount },
    { count: eventCount },
    { count: blogCount },
    { data: pendingMembers },
    { data: recentMembers },
    { data: recentDonations },
    { data: donationTotal },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id').eq('membership_status', 'pending'),
    supabase
      .from('profiles')
      .select('id, full_name, membership_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('donations')
      .select('id, donor_name, amount, status, created_at, donation_campaigns(title)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('donations')
      .select('amount')
      .eq('status', 'completed'),
  ])

  const totalRaised = (donationTotal ?? []).reduce((sum: number, d: { amount: number }) => sum + (d.amount ?? 0), 0)
  const pendingCount = (pendingMembers ?? []).length

  const stats = [
    {
      label: 'Total Members', value: String(memberCount ?? 0),
      change: `${pendingCount} pending`, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50', href: '/admin/members',
    },
    {
      label: 'Total Events', value: String(eventCount ?? 0),
      change: 'View all events', icon: CalendarDays, color: 'text-sky-600', bg: 'bg-sky-50', href: '/admin/events',
    },
    {
      label: 'Total Donations',
      value: totalRaised >= 1_000_000 ? `KES ${(totalRaised / 1_000_000).toFixed(1)}M` : `KES ${Math.round(totalRaised / 1000)}K`,
      change: 'Completed only', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', href: '/admin/donations',
    },
    {
      label: 'Blog Posts', value: String(blogCount ?? 0),
      change: 'All posts', icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50', href: '/admin/content',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {pendingCount > 0 && (
          <Link href="/admin/members?filter=pending" className="flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-200 rounded-xl text-sm font-semibold text-sky-700 hover:bg-sky-100 transition-colors">
            <AlertCircle className="w-4 h-4" />
            {pendingCount} Pending Application{pendingCount !== 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="card p-5 group">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
            <div className="text-sm font-medium text-slate-700 mt-0.5">{label}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary-500" />
              {change}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent members */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-slate-900">Recent Members</h2>
            <Link href="/admin/members" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentMembers ?? []).map((member) => (
              <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                    {(member.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{member.full_name ?? 'Unknown'}</div>
                    <div className="text-xs text-slate-400">
                      Joined {new Date(member.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span className={`badge text-xs ${member.membership_status === 'approved' ? 'badge-green' : member.membership_status === 'rejected' ? 'badge-gray' : 'badge-sky'}`}>
                  {member.membership_status ?? 'pending'}
                </span>
              </div>
            ))}
            {(recentMembers ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No members yet</p>
            )}
          </div>
        </div>

        {/* Recent donations */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-slate-900">Recent Donations</h2>
            <Link href="/admin/donations" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentDonations ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{d.donor_name ?? 'Anonymous'}</div>
                  <div className="text-xs text-slate-400">
                    {(d.donation_campaigns as any)?.title ?? 'General'} ·{' '}
                    {new Date(d.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-primary-600">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  KES {Number(d.amount).toLocaleString()}
                </div>
              </div>
            ))}
            {(recentDonations ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No donations yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Create Event', href: '/admin/events' },
            { label: 'Write Blog Post', href: '/admin/content/new' },
            { label: 'New Announcement', href: '/admin/announcements' },
            { label: 'Review Applications', href: '/admin/members?filter=pending' },
            { label: 'View Donation Report', href: '/admin/donations' },
            { label: 'Edit Site Settings', href: '/admin/settings' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-slate-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

