import { TrendingUp, Heart, Target, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { updateDonationStatus } from '@/app/actions/admin'
import DonationsTable from '@/components/admin/DonationsTable'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Donations' }

const campaignColors = ['bg-sky-500', 'bg-primary-500', 'bg-emerald-600', 'bg-purple-500', 'bg-rose-500']

export default async function AdminDonationsPage() {
  const supabase = await createClient()

  const [donationsRes, campaignsRes] = await Promise.all([
    supabase
      .from('donations')
      .select('id, donor_name, donor_email, amount, currency, payment_method, status, is_anonymous, created_at, donation_campaigns(title)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('donation_campaigns')
      .select('id, title, goal, raised')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ])

  const donations = donationsRes.data ?? []
  const campaigns = campaignsRes.data ?? []

  // Flatten campaign title for client component
  const donationRows = donations.map((d) => ({
    ...d,
    campaign_title: (d.donation_campaigns as unknown as { title: string } | null)?.title ?? null,
    donation_campaigns: undefined,
  }))

  const completed = donations.filter((d) => d.status === 'completed')
  const totalRaised = completed.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  const avgDonation = completed.length > 0 ? Math.round(totalRaised / completed.length) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Donation Tracking</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor campaigns and individual contributions.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">
            {totalRaised >= 1_000_000
              ? `KES ${(totalRaised / 1_000_000).toFixed(1)}M`
              : `KES ${totalRaised.toLocaleString()}`}
          </div>
          <div className="text-sm text-slate-600 mt-0.5 font-medium">Total Raised</div>
          <div className="flex items-center gap-1 text-xs text-primary-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            Completed donations
          </div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-extrabold text-primary-600">{completed.length}</div>
          <div className="text-sm text-slate-600 mt-0.5 font-medium">Successful Donations</div>
          <div className="text-xs text-slate-400 mt-1">{donations.length} total transactions</div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center mb-3">
            <ArrowUpRight className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-sky-600">
            KES {avgDonation.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600 mt-0.5 font-medium">Average Donation</div>
        </div>
      </div>

      {/* Campaign progress */}
      {campaigns.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5">Active Campaign Progress</h2>
          <div className="space-y-4">
            {campaigns.map((c, idx) => {
              const pct = c.goal > 0 ? Math.min(Math.round((c.raised / c.goal) * 100), 100) : 0
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{c.title}</span>
                    <span className="text-sm text-slate-500">
                      KES {Number(c.raised).toLocaleString()} / KES {Number(c.goal).toLocaleString()}{' '}
                      <span className="font-bold text-slate-700">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${campaignColors[idx % campaignColors.length]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Donations table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-slate-900">Recent Transactions</h2>
          <span className="text-xs text-slate-400">{donations.length} total</span>
        </div>
        {donations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No donations recorded yet.</div>
        ) : (
          <DonationsTable
            donations={donationRows as any[]}
            updateDonationStatus={updateDonationStatus}
          />
        )}
      </div>
    </div>
  )
}


