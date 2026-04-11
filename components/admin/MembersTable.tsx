'use client'

import { useState, useTransition } from 'react'
import { Search, Filter, CheckCircle, XCircle, Eye, MoreHorizontal, UserPlus, Loader2 } from 'lucide-react'
import { updateMemberStatus, updateMemberTier } from '@/app/actions/admin'

type Member = {
  id: string
  full_name: string | null
  phone: string | null
  tier: string
  membership_status: string
  created_at: string
  rsvp_count: number
}

const statusColors: Record<string, string> = {
  approved: 'badge-green',
  pending: 'badge-sky',
  rejected: 'badge-red',
}

const tierColors: Record<string, string> = {
  basic: 'badge-gray',
  active: 'badge-green',
  champion: 'bg-purple-100 text-purple-800 badge',
}

export default function MembersTable({ members }: { members: Member[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [pending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  const filtered = members.filter((m) => {
    const name = m.full_name || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || m.membership_status === filter
    return matchesSearch && matchesFilter
  })

  const pendingCount = members.filter((m) => m.membership_status === 'pending').length

  function handleStatus(id: string, status: 'approved' | 'rejected') {
    setActionId(id)
    startTransition(async () => {
      await updateMemberStatus(id, status)
      setActionId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {members.length} total members · {pendingCount} pending approval
          </p>
        </div>
        <button className="btn-primary text-sm">
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-800">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-sm font-semibold">
              {pendingCount} membership application{pendingCount > 1 ? 's' : ''} awaiting review
            </span>
          </div>
          <button
            onClick={() => setFilter('pending')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 underline"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Events</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((member) => {
                const name = member.full_name || 'Unknown'
                const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                const isActing = actionId === member.id && pending

                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-800">{name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{member.phone || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-sm">
                      {new Date(member.created_at).toLocaleDateString('en-KE', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={tierColors[member.tier] || 'badge-gray'}>{member.tier}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium text-sm">{member.rsvp_count}</td>
                    <td className="px-5 py-4">
                      <span className={statusColors[member.membership_status] || 'badge-gray'}>
                        {member.membership_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {isActing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            {member.membership_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatus(member.id, 'approved')}
                                  className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatus(member.id, 'rejected')}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {member.membership_status === 'approved' && (
                              <button
                                onClick={() => handleStatus(member.id, 'rejected')}
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                title="Revoke"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {member.membership_status === 'rejected' && (
                              <button
                                onClick={() => handleStatus(member.id, 'approved')}
                                className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                                title="Re-approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100 transition-colors"
                          title="More"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No members found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
