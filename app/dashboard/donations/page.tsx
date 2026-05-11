import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Heart, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Donations | Dashboard' }

export default async function DashboardDonationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawDonations } = await supabase
    .from('donations')
    .select('id, amount, payment_method, status, reference, created_at, donation_campaigns ( title, slug )')
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false })

  const donations = (rawDonations ?? []).map((d) => ({
    ...d,
    donation_campaigns: Array.isArray(d.donation_campaigns) ? (d.donation_campaigns[0] ?? null) : d.donation_campaigns,
  }))

  const total = (donations ?? [])
    .filter((d) => d.status === 'confirmed')
    .reduce((sum, d) => sum + (d.amount ?? 0), 0)

  const statusBadge: Record<string, string> = {
    confirmed: 'badge-green',
    pending:   'badge-sky',
    failed:    'badge-red',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Donations</h1>
        <p className="text-slate-500 text-sm mt-1">Your contribution history to Inua Jamii Foundation</p>
      </div>

      {/* Summary card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="p-3 bg-rose-50 rounded-xl">
          <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">KES {total.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Total confirmed donations</p>
        </div>
        <Link href="/donate" className="ml-auto btn-primary text-sm flex items-center gap-2">
          <Heart className="w-4 h-4" /> Donate Again
        </Link>
      </div>

      {/* Table */}
      {(!donations || donations.length === 0) ? (
        <div className="card p-12 text-center text-slate-400">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No donations yet</p>
          <p className="text-sm mt-1">Your donation history will appear here once you make a contribution.</p>
          <Link href="/donate" className="btn-primary text-sm mt-4 inline-flex">Make a Donation</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Campaign</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Method</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Reference</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-left hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {d.donation_campaigns?.title ?? 'General Fund'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                    KES {(d.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell capitalize">
                    {d.payment_method ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs font-mono hidden md:table-cell">
                    {d.reference ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`badge ${statusBadge[d.status] ?? 'badge-gray'} text-xs capitalize`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs hidden lg:table-cell">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(d.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
