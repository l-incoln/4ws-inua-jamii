'use client'

import { useState, useTransition } from 'react'
import {
  Search, Filter, CheckCircle, XCircle, Eye, Loader2,
  UserPlus, Download, Users, ChevronDown, CreditCard, RefreshCw, Plus, X,
} from 'lucide-react'
import { updateMemberStatus, updateMemberTier, bulkUpdateMemberStatus, issueMembership, renewMembership } from '@/app/actions/admin'
import { TIER_LABELS, TIER_COLORS, type MembershipTier } from '@/types'

type Member = {
  id: string
  full_name: string | null
  phone: string | null
  tier: string
  membership_status: string
  created_at: string
  rsvp_count: number
  has_active_term: boolean
  term_id: string | null
}

const statusColors: Record<string, string> = {
  approved: 'badge-green',
  pending: 'badge-sky',
  rejected: 'badge-red',
}

export default function MembersTable({ members }: { members: Member[] }) {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | 'basic' | 'active' | 'champion'>('all')
  const [pending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'approved' | 'rejected' | 'pending' | ''>('')
  const [showTierDropdown, setShowTierDropdown] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [issueDropdown, setIssueDropdown] = useState<string | null>(null)
  const [issueData, setIssueData] = useState<{ tier: MembershipTier; months: string }>({ tier: 'basic', months: '12' })
  const [issueMsg, setIssueMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const filtered = members.filter((m) => {
    const name = m.full_name || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || '').includes(search)
    const matchesStatus = filter === 'all' || m.membership_status === filter
    const matchesTier   = tierFilter === 'all' || m.tier === tierFilter
    return matchesSearch && matchesStatus && matchesTier
  })

  const pendingCount = members.filter((m) => m.membership_status === 'pending').length
  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id))

  function toggleSelectAll() {
    if (allFilteredSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((m) => m.id)))
  }

  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function handleStatus(id: string, status: 'approved' | 'rejected') {
    setActionId(id)
    startTransition(async () => {
      await updateMemberStatus(id, status)
      setActionId(null)
    })
  }

  function handleTierChange(id: string, tier: 'basic' | 'active' | 'champion') {
    setShowTierDropdown(null)
    setActionId(id)
    startTransition(async () => {
      await updateMemberTier(id, tier)
      setActionId(null)
    })
  }

  function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return
    const ids = Array.from(selected)
    startTransition(async () => {
      await bulkUpdateMemberStatus(ids, bulkAction)
      setSelected(new Set())
      setBulkAction('')
    })
  }

  function openIssueForm(member: Member) {
    setIssueDropdown(member.id)
    setIssueData({ tier: member.tier as MembershipTier, months: '12' })
    setIssueMsg(null)
  }

  function handleIssueOrRenew(member: Member) {
    startTransition(async () => {
      setIssueMsg(null)
      let res
      if (member.has_active_term && member.term_id) {
        res = await renewMembership(member.term_id, parseInt(issueData.months) || 12)
      } else {
        res = await issueMembership(member.id, issueData.tier, parseInt(issueData.months) || 12)
      }
      if (res?.error) {
        setIssueMsg({ id: member.id, msg: res.error, ok: false })
      } else {
        setIssueMsg({ id: member.id, msg: member.has_active_term ? 'Renewed!' : 'Membership issued!', ok: true })
        setTimeout(() => { setIssueDropdown(null); setIssueMsg(null) }, 2000)
      }
    })
  }

  async function handleExport(exportSelected = false) {
    setExporting(true)
    const url = `/api/admin/export/members`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {members.length} total · {pendingCount} pending approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport()} disabled={exporting} className="btn-outline text-sm">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <button className="btn-primary text-sm">
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-primary-800">
            <Users className="w-4 h-4 inline mr-1" />
            {selected.size} selected
          </span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)} className="input py-1.5 text-sm w-auto">
            <option value="">Bulk action…</option>
            <option value="approved">Approve all</option>
            <option value="rejected">Reject all</option>
            <option value="pending">Reset to pending</option>
          </select>
          <button onClick={handleBulkAction} disabled={!bulkAction || pending} className="btn-primary text-sm py-1.5 disabled:opacity-50">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
          </button>
          <button onClick={() => handleExport(true)} disabled={exporting} className="btn-outline text-sm py-1.5">
            <Download className="w-3.5 h-3.5" /> Export Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-slate-500 hover:text-slate-800">Clear</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200" />
          {(['all', 'basic', 'active', 'champion'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tierFilter === t ? 'bg-slate-700 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'All Tiers' : TIER_LABELS[t as MembershipTier]}
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
                <th className="px-5 py-3.5 w-10">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-primary-600" />
                </th>
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

                const tierLabel = TIER_LABELS[member.tier as MembershipTier] ?? member.tier
                const tierColor = TIER_COLORS[member.tier as MembershipTier] ?? 'badge-gray'

                return (
                  <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${selected.has(member.id) ? 'bg-primary-50/40' : ''}`}>
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selected.has(member.id)} onChange={() => toggleSelect(member.id)} className="w-4 h-4 rounded accent-primary-600" />
                    </td>
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
                      <div className="relative">
                        <button
                          onClick={() => setShowTierDropdown(showTierDropdown === member.id ? null : member.id)}
                          className={`${tierColor} flex items-center gap-1 cursor-pointer hover:opacity-80`}
                          title="Click to change tier"
                        >
                          {tierLabel} <ChevronDown className="w-3 h-3" />
                        </button>
                        {showTierDropdown === member.id && (
                          <div className="absolute left-0 top-full mt-1 z-20 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            {(['basic', 'active', 'champion'] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => handleTierChange(member.id, t)}
                                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 text-slate-700 font-medium transition-colors"
                              >
                                {TIER_LABELS[t]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
                        <div className="relative">
                          <button
                            onClick={() => issueDropdown === member.id ? setIssueDropdown(null) : openIssueForm(member)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              member.has_active_term
                                ? 'text-sky-500 bg-sky-50 hover:bg-sky-100'
                                : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                            }`}
                            title={member.has_active_term ? 'Renew membership' : 'Issue membership'}
                          >
                            {member.has_active_term
                              ? <RefreshCw className="w-4 h-4" />
                              : <CreditCard className="w-4 h-4" />}
                          </button>
                          {issueDropdown === member.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-slate-700">
                                  {member.has_active_term ? 'Renew Membership' : 'Issue Membership'}
                                </p>
                                <button onClick={() => setIssueDropdown(null)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                              </div>
                              {!member.has_active_term && (
                                <select
                                  value={issueData.tier}
                                  onChange={(e) => setIssueData((d) => ({ ...d, tier: e.target.value as MembershipTier }))}
                                  className="input text-xs w-full py-1.5"
                                >
                                  <option value="basic">Classic (Basic)</option>
                                  <option value="active">Premium (Active)</option>
                                  <option value="champion">Gold (Champion)</option>
                                </select>
                              )}
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={36}
                                  value={issueData.months}
                                  onChange={(e) => setIssueData((d) => ({ ...d, months: e.target.value }))}
                                  placeholder="Months"
                                  className="input text-xs flex-1 py-1.5"
                                />
                                <button
                                  onClick={() => handleIssueOrRenew(member)}
                                  disabled={pending}
                                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                  {member.has_active_term ? 'Renew' : 'Issue'}
                                </button>
                              </div>
                              {issueMsg?.id === member.id && (
                                <p className={`text-xs font-medium ${issueMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {issueMsg.msg}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <a
                          href={`/admin/members/${member.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100 transition-colors"
                          title="View profile"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
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
