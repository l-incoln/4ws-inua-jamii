'use client'

import { useState, useTransition } from 'react'
import { updateRegistrationStatus, deleteRegistration } from '@/app/actions/admin'
import { Loader2, Trash2, Download, CheckCircle2, XCircle, Clock } from 'lucide-react'

type Registration = {
  id: string
  full_name: string
  email: string
  phone: string | null
  field_data: Record<string, string> | null
  status: string
  source: string
  external_completed: boolean
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  registered: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  attended: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUSES = ['pending', 'registered', 'confirmed', 'attended', 'cancelled']

function exportCSV(registrations: Registration[], fieldName: string) {
  const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Registered At', ...(fieldName ? [] : [])]
  const rows = registrations.map((r) => [
    r.full_name,
    r.email,
    r.phone || '',
    r.status,
    r.source,
    new Date(r.created_at).toLocaleString(),
  ])
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `registrations.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminRegistrationsClient({
  eventId,
  eventTitle,
  registrations,
  maxAttendees,
}: {
  eventId: string
  eventTitle: string
  registrations: Registration[]
  maxAttendees: number | null
}) {
  const [filter, setFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [list, setList] = useState<Registration[]>(registrations)
  const [, startTransition] = useTransition()

  const filtered = filter === 'all' ? list : list.filter((r) => r.status === filter)
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = list.filter((r) => r.status === s).length
    return acc
  }, {} as Record<string, number>)

  function handleStatusChange(regId: string, status: string) {
    setUpdating(regId)
    startTransition(async () => {
      const result = await updateRegistrationStatus(regId, status)
      setUpdating(null)
      if (result?.error) {
        alert(result.error)
      } else {
        setList((prev) => prev.map((r) => r.id === regId ? { ...r, status } : r))
      }
    })
  }

  function handleDelete(regId: string) {
    startTransition(async () => {
      const result = await deleteRegistration(regId)
      setDeleteId(null)
      if (result?.error) {
        alert(result.error)
      } else {
        setList((prev) => prev.filter((r) => r.id !== regId))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-sm text-slate-500 mt-1">{eventTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {maxAttendees && (
            <span className="text-sm text-slate-500">
              {list.filter((r) => r.status !== 'cancelled').length} / {maxAttendees} registered
            </span>
          )}
          <button
            onClick={() => exportCSV(filtered, '')}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All ({list.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filter === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Registrations table */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p>No registrations {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Registered</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => (
                  <tr key={reg.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{reg.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{reg.email}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{reg.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 capitalize">{reg.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={reg.status}
                        onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                        disabled={updating === reg.id}
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer capitalize ${STATUS_COLORS[reg.status] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-white text-slate-900 capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {new Date(reg.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(reg.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        aria-label="Delete registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 mb-2">Delete Registration?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently remove the registration record. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
