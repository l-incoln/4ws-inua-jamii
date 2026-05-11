'use client'

import { useState, useTransition } from 'react'
import { FileText, Check, X, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { updateApplicationStatus } from '@/app/actions/admin'
import type { ApplicationStatus } from '@/types'

interface Program { id: string; title: string; slug: string }
interface Profile { id: string; full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null }
interface Application {
  id: string
  motivation: string
  availability: string | null
  status: ApplicationStatus
  admin_note: string | null
  created_at: string
  programs: Program | null
  profiles: Profile | null
}

type Filter = ApplicationStatus | 'all'

const STATUS_STYLES: Record<ApplicationStatus, { cls: string; label: string }> = {
  pending:  { cls: 'bg-amber-100 text-amber-700',  label: 'Pending' },
  accepted: { cls: 'bg-green-100 text-green-700',  label: 'Accepted' },
  rejected: { cls: 'bg-red-100 text-red-700',     label: 'Rejected' },
}

export default function ApplicationsClient({ applications: initial }: { applications: Application[] }) {
  const [applications, setApplications] = useState(initial)
  const [filter, setFilter] = useState<Filter>('pending')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ id: string; type: 'success'|'error'; msg: string } | null>(null)

  function showToast(id: string, type: 'success'|'error', msg: string) {
    setToast({ id, type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function updateStatus(id: string, status: ApplicationStatus) {
    const note = noteEdits[id]
    startTransition(async () => {
      const result = await updateApplicationStatus(id, status, note)
      if (result?.error) { showToast(id, 'error', result.error); return }
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status, admin_note: note ?? a.admin_note } : a))
      showToast(id, 'success', `Application ${status}.`)
    })
  }

  const filtered = applications.filter((a) => filter === 'all' || a.status === filter)
  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Program Applications</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pendingCount > 0 ? (
            <span className="text-amber-600 font-medium">{pendingCount} awaiting review</span>
          ) : (
            `${applications.length} total`
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['pending', 'accepted', 'rejected', 'all'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}{f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No {filter !== 'all' ? filter : ''} applications</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((a) => {
          const isOpen = expanded.has(a.id)
          const style = STATUS_STYLES[a.status]

          return (
            <div key={a.id} className="card overflow-hidden">
              {/* Header row */}
              <button onClick={() => toggleExpand(a.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{a.profiles?.full_name ?? 'Unknown'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.cls}`}>{style.label}</span>
                    <span className="text-xs text-slate-400">{a.programs?.title ?? 'Unknown Program'}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.profiles?.email} · Applied {new Date(a.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Motivation</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.motivation}</p>
                  </div>
                  {a.availability && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Availability</p>
                      <p className="text-sm text-slate-700">{a.availability}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Admin Note (optional)</label>
                    <textarea
                      className="input resize-none text-sm"
                      rows={2}
                      placeholder="Leave an internal note or feedback for the applicant…"
                      value={noteEdits[a.id] ?? (a.admin_note ?? '')}
                      onChange={(e) => setNoteEdits({ ...noteEdits, [a.id]: e.target.value })}
                    />
                  </div>

                  {toast?.id === a.id && (
                    <div className={`text-sm rounded-xl px-4 py-2 flex items-center gap-2 ${
                      toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      {toast.msg}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateStatus(a.id, 'accepted')}
                      disabled={isPending || a.status === 'accepted'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => updateStatus(a.id, 'rejected')}
                      disabled={isPending || a.status === 'rejected'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    {a.status !== 'pending' && (
                      <button
                        onClick={() => updateStatus(a.id, 'pending')}
                        disabled={isPending}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                      >
                        <Clock className="w-4 h-4" /> Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
