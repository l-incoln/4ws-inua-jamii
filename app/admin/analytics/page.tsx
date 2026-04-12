import { createClient } from '@/lib/supabase/server'
import { BarChart2, Users, CalendarDays, Heart, FileText, TrendingUp, DollarSign } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics | Admin' }

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const [
    { data: membersByTier },
    { data: membersByStatus },
    { data: eventData },
    { data: rsvpData },
    { data: blogData },
    { data: donationRows },
    { data: donationsByMonth },
  ] = await Promise.all([
    supabase.from('profiles').select('tier').neq('role', 'admin'),
    supabase.from('profiles').select('membership_status').neq('role', 'admin'),
    supabase.from('events').select('id, title, event_date, status').order('event_date', { ascending: false }).limit(20),
    supabase.from('rsvps').select('event_id'),
    supabase.from('blog_posts').select('id, title, category, published_at, status').order('published_at', { ascending: false }).limit(20),
    supabase.from('donations').select('amount, status, created_at'),
    supabase.from('donations').select('amount, status, created_at').eq('status', 'completed'),
  ])

  // Compute member stats
  const tierCounts = (membersByTier ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.tier ?? 'unknown'] = (acc[r.tier ?? 'unknown'] ?? 0) + 1
    return acc
  }, {})
  const statusCounts = (membersByStatus ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.membership_status ?? 'unknown'] = (acc[r.membership_status ?? 'unknown'] ?? 0) + 1
    return acc
  }, {})
  const totalMembers = (membersByTier ?? []).length

  // Compute RSVP counts per event
  const rsvpPerEvent = (rsvpData ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.event_id] = (acc[r.event_id] ?? 0) + 1
    return acc
  }, {})

  // Compute blog category counts
  const catCounts = (blogData ?? []).filter(p => p.status === 'published').reduce<Record<string, number>>((acc, r) => {
    acc[r.category ?? 'other'] = (acc[r.category ?? 'other'] ?? 0) + 1
    return acc
  }, {})

  // Donation totals
  const totalDonated = (donationsByMonth ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const pendingAmount = (donationRows ?? []).filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount ?? 0), 0)

  // Donations by month (last 6 months)
  const monthlyMap: Record<string, number> = {}
  ;(donationsByMonth ?? []).forEach(r => {
    const m = new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    monthlyMap[m] = (monthlyMap[m] ?? 0) + r.amount
  })
  const monthlyEntries = Object.entries(monthlyMap).slice(-6)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform metrics and trends</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers, icon: Users, color: 'bg-primary-50 text-primary-700' },
          { label: 'Total Events', value: (eventData ?? []).length, icon: CalendarDays, color: 'bg-amber-50 text-amber-700' },
          { label: 'Blog Posts', value: (blogData ?? []).filter(p => p.status === 'published').length, icon: FileText, color: 'bg-sky-50 text-sky-700' },
          { label: 'Donations Received', value: `KSh ${totalDonated.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members by Tier */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-slate-900">Members by Tier</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'basic', label: 'Basic', color: 'bg-sky-500' },
              { key: 'active', label: 'Active', color: 'bg-primary-500' },
              { key: 'champion', label: 'Champion', color: 'bg-amber-500' },
            ].map(({ key, label, color }) => {
              const count = tierCounts[key] ?? 0
              const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center text-xs">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="bg-slate-50 rounded-xl py-2">
                <div className="font-bold text-slate-900 text-base">{count}</div>
                <div className="text-slate-500 capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Donations by Month */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-slate-900">Donations by Month</h2>
          </div>
          {monthlyEntries.length > 0 ? (
            <div className="space-y-3">
              {monthlyEntries.map(([month, amount]) => {
                const max = Math.max(...monthlyEntries.map(([, v]) => v), 1)
                const pct = Math.round((amount / max) * 100)
                return (
                  <div key={month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{month}</span>
                      <span className="text-slate-500">KSh {amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No completed donations yet.</p>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center text-xs">
            <div className="bg-green-50 rounded-xl py-2">
              <div className="font-bold text-slate-900 text-base">KSh {totalDonated.toLocaleString()}</div>
              <div className="text-slate-500">Completed</div>
            </div>
            <div className="bg-amber-50 rounded-xl py-2">
              <div className="font-bold text-slate-900 text-base">KSh {pendingAmount.toLocaleString()}</div>
              <div className="text-slate-500">Pending</div>
            </div>
          </div>
        </div>

        {/* Events RSVP summary */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900">Event RSVP Summary</h2>
          </div>
          {(eventData ?? []).length > 0 ? (
            <div className="space-y-2">
              {(eventData ?? []).slice(0, 8).map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{event.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(event.event_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-1.5 shrink-0">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">{rsvpPerEvent[event.id] ?? 0}</span>
                    <span className="text-xs text-slate-400">RSVPs</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No events found.</p>
          )}
        </div>

        {/* Blog by Category */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-900">Blog by Category</h2>
          </div>
          {Object.keys(catCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(catCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const total = Object.values(catCounts).reduce((s, n) => s + n, 0)
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 capitalize">{cat}</span>
                        <span className="text-slate-500">{count} post{count !== 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No published blog posts yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
