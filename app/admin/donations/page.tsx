import { TrendingUp, Heart, Target, ArrowUpRight, Download } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Donations' }

const donations = [
  { id: '1', name: 'James Kariuki', email: 'james@example.com', amount: 5000, campaign: 'Education Fund', method: 'M-Pesa', date: '2026-04-10', status: 'completed' },
  { id: '2', name: 'Anonymous', email: '—', amount: 2500, campaign: 'Health Campaign', method: 'M-Pesa', date: '2026-04-09', status: 'completed' },
  { id: '3', name: 'Mary Wanjiru', email: 'mary@example.com', amount: 10000, campaign: 'General Fund', method: 'Card', date: '2026-04-08', status: 'completed' },
  { id: '4', name: 'Peter Ochieng', email: 'peter@example.com', amount: 1000, campaign: 'Environment', method: 'M-Pesa', date: '2026-04-07', status: 'completed' },
  { id: '5', name: 'Susan Kamau', email: 'susan@example.com', amount: 7500, campaign: 'Education Fund', method: 'Card', date: '2026-04-06', status: 'completed' },
  { id: '6', name: 'Daniel Mwenda', email: 'daniel@example.com', amount: 500, campaign: 'Health Campaign', method: 'M-Pesa', date: '2026-04-05', status: 'failed' },
  { id: '7', name: 'Faith Njeri', email: 'faith@example.com', amount: 3000, campaign: 'Women Empowerment', method: 'Card', date: '2026-04-04', status: 'completed' },
  { id: '8', name: 'Anonymous', email: '—', amount: 1500, campaign: 'General Fund', method: 'M-Pesa', date: '2026-04-03', status: 'completed' },
]

const campaigns = [
  { name: 'Education Fund', goal: 500000, raised: 312000, color: 'bg-sky-500' },
  { name: 'Health Campaign', goal: 300000, raised: 178000, color: 'bg-primary-500' },
  { name: 'General Fund', goal: 200000, raised: 139500, color: 'bg-sky-500' },
  { name: 'Environment', goal: 150000, raised: 48000, color: 'bg-emerald-600' },
]

const totalRaised = donations
  .filter((d) => d.status === 'completed')
  .reduce((sum, d) => sum + d.amount, 0)

const statusColors: Record<string, string> = {
  completed: 'badge-green',
  failed: 'badge-red',
  pending: 'badge-sky',
}

export default function AdminDonationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donation Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor campaigns and individual contributions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">KES {totalRaised.toLocaleString()}</div>
          <div className="text-sm text-slate-600 mt-0.5 font-medium">Total Raised</div>
          <div className="flex items-center gap-1 text-xs text-primary-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            +18% vs last month
          </div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-3xl font-extrabold text-primary-600">{donations.filter((d) => d.status === 'completed').length}</div>
          <div className="text-sm text-slate-600 mt-0.5 font-medium">Successful Donations</div>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center mb-3">
            <ArrowUpRight className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-sky-600">
            KES {Math.round(totalRaised / donations.filter((d) => d.status === 'completed').length).toLocaleString()}
          </div>
          <div className="text-sm text-slate-600 mt-0.5 font-medium">Average Donation</div>
        </div>
      </div>

      {/* Campaign progress */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-5">Campaign Progress</h2>
        <div className="space-y-4">
          {campaigns.map((c) => {
            const pct = Math.round((c.raised / c.goal) * 100)
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                  <span className="text-sm text-slate-500">
                    KES {c.raised.toLocaleString()} of KES {c.goal.toLocaleString()} <span className="font-bold text-slate-700">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Donations table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-slate-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3.5 text-left">Donor</th>
                <th className="px-5 py-3.5 text-left">Campaign</th>
                <th className="px-5 py-3.5 text-left">Amount</th>
                <th className="px-5 py-3.5 text-left">Method</th>
                <th className="px-5 py-3.5 text-left">Date</th>
                <th className="px-5 py-3.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="font-semibold text-slate-800">{d.name}</div>
                    <div className="text-xs text-slate-400">{d.email}</div>
                  </td>
                  <td className="table-cell">
                    <span className="badge-gray text-xs">{d.campaign}</span>
                  </td>
                  <td className="table-cell font-bold text-primary-600">
                    KES {d.amount.toLocaleString()}
                  </td>
                  <td className="table-cell text-sm text-slate-500">{d.method}</td>
                  <td className="table-cell text-sm text-slate-500">
                    {new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="table-cell">
                    <span className={statusColors[d.status]}>{d.status}</span>
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

