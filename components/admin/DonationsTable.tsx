'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, RotateCcw, Loader2, ChevronDown } from 'lucide-react'

type Donation = {
  id: string
  donor_name: string | null
  donor_email: string | null
  amount: number
  currency: string | null
  payment_method: string | null
  status: string
  is_anonymous: boolean
  created_at: string
  campaign_title: string | null
}

const statusColors: Record<string, string> = {
  completed: 'badge-green',
  failed: 'badge-red',
  pending: 'badge-sky',
  refunded: 'badge-gray',
}

export default function DonationsTable({
  donations: initialDonations,
  updateDonationStatus,
}: {
  donations: Donation[]
  updateDonationStatus: (id: string, status: 'completed' | 'failed' | 'refunded') => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [isPending, start] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [donations, setDonations] = useState<Donation[]>(initialDonations)

  function handleUpdate(donationId: string, newStatus: 'completed' | 'failed' | 'refunded') {
    setActionId(donationId)
    setOpenDropdown(null)
    start(async () => {
      const result = await updateDonationStatus(donationId, newStatus)
      if (!result.error) {
        setDonations((prev) =>
          prev.map((d) => d.id === donationId ? { ...d, status: newStatus } : d)
        )
      }
      setActionId(null)
    })
  }

  return (
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
            <th className="px-5 py-3.5 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {donations.map((d) => {
            const displayName = d.is_anonymous ? 'Anonymous' : (d.donor_name || 'Unknown')
            const displayEmail = d.is_anonymous ? '—' : (d.donor_email || '—')
            const isLoading = actionId === d.id && isPending
            return (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="font-semibold text-slate-800">{displayName}</div>
                  <div className="text-xs text-slate-400">{displayEmail}</div>
                </td>
                <td className="table-cell">
                  <span className="badge-gray text-xs">{d.campaign_title ?? 'General'}</span>
                </td>
                <td className="table-cell font-bold text-primary-600">
                  {d.currency ?? 'KES'} {Number(d.amount).toLocaleString()}
                </td>
                <td className="table-cell text-sm text-slate-500 capitalize">
                  {d.payment_method ?? '—'}
                </td>
                <td className="table-cell text-sm text-slate-500">
                  {new Date(d.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="table-cell">
                  <span className={statusColors[d.status] ?? 'badge-gray'}>{d.status}</span>
                </td>
                <td className="table-cell">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === d.id ? null : d.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-slate-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Update <ChevronDown className="w-3 h-3" />
                      </button>
                      {openDropdown === d.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                          <button
                            onClick={() => handleUpdate(d.id, 'completed')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdate(d.id, 'failed')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Mark Failed
                          </button>
                          <button
                            onClick={() => handleUpdate(d.id, 'refunded')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Mark Refunded
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
