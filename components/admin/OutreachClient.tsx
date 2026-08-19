'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Edit2, X, Download, MapPin, Users } from 'lucide-react'
import { saveOutreachActivity, deleteOutreachActivity } from '@/app/actions/impact-tracking'

interface OutreachActivity {
  id: string
  title: string
  description: string | null
  activity_type: string
  location: string | null
  participants: number
  beneficiaries: number
  activity_date: string
  status: string
  image_url: string | null
  program_id: string | null
}

interface Program { id: string; title: string }

const TYPES = [
  { value: 'community_visit', label: 'Community Visit' },
  { value: 'health_camp', label: 'Health Camp' },
  { value: 'education_drive', label: 'Education Drive' },
  { value: 'environmental', label: 'Environmental Action' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'awareness_campaign', label: 'Awareness Campaign' },
  { value: 'other', label: 'Other' },
]

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  ongoing: 'bg-blue-100 text-blue-700',
  planned: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

export default function OutreachClient({ activities, programs }: { activities: OutreachActivity[]; programs: Program[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OutreachActivity | null>(null)
  const [isPending, startTransition] = useTransition()

  const totalBeneficiaries = activities.reduce((s, a) => s + a.beneficiaries, 0)
  const totalParticipants = activities.reduce((s, a) => s + a.participants, 0)
  const completedCount = activities.filter((a) => a.status === 'completed').length

  function openNew() { setEditing(null); setShowForm(true) }
  function openEdit(a: OutreachActivity) { setEditing(a); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null) }

  function handleDelete(id: string) {
    if (!confirm('Delete this outreach activity?')) return
    startTransition(async () => { await deleteOutreachActivity(id) })
  }

  function handleSubmit(formData: FormData) {
    const id = editing?.id ?? null
    startTransition(async () => { await saveOutreachActivity(id, formData); closeForm() })
  }

  function exportCsv() {
    const headers = ['Date', 'Title', 'Type', 'Status', 'Location', 'Participants', 'Beneficiaries', 'Description']
    const rows = activities.map((a) => [
      a.activity_date, a.title, a.activity_type, a.status, a.location ?? '', a.participants, a.beneficiaries, a.description ?? '',
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `outreach-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outreach Activities</h1>
          <p className="text-slate-500 text-sm mt-1">Track community visits, health camps, education drives, and awareness campaigns</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Activity
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-slate-900">{activities.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Activities</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-emerald-600">{completedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-sky-600">{totalBeneficiaries.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Beneficiaries Reached</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-violet-600">{totalParticipants.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Participants Engaged</p>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{editing ? 'Edit Activity' : 'New Outreach Activity'}</h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Title *</label>
                <input name="title" required defaultValue={editing?.title ?? ''} className="input mt-1" placeholder="Community health camp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Type *</label>
                  <select name="activity_type" required defaultValue={editing?.activity_type ?? 'community_visit'} className="input mt-1">
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Status</label>
                  <select name="status" defaultValue={editing?.status ?? 'completed'} className="input mt-1">
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Date *</label>
                  <input name="activity_date" type="date" required defaultValue={editing?.activity_date ?? new Date().toISOString().slice(0, 10)} className="input mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Participants</label>
                  <input name="participants" type="number" min="0" defaultValue={editing?.participants ?? 0} className="input mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Beneficiaries</label>
                  <input name="beneficiaries" type="number" min="0" defaultValue={editing?.beneficiaries ?? 0} className="input mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Location</label>
                <input name="location" defaultValue={editing?.location ?? ''} className="input mt-1" placeholder="Nairobi, Kenya" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Image URL (optional)</label>
                <input name="image_url" type="url" defaultValue={editing?.image_url ?? ''} className="input mt-1" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Program (optional)</label>
                <select name="program_id" defaultValue={editing?.program_id ?? ''} className="input mt-1">
                  <option value="">— None —</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Description</label>
                <textarea name="description" rows={2} defaultValue={editing?.description ?? ''} className="input mt-1 resize-none" placeholder="Brief description of the outreach activity" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isPending} className="btn-primary flex-1 text-sm justify-center">
                  {isPending ? 'Saving...' : editing ? 'Update Activity' : 'Create Activity'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activities grid */}
      {activities.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-2">🤝</p>
          <p className="text-sm text-slate-500">No outreach activities recorded yet.</p>
          <button onClick={openNew} className="btn-primary text-sm mt-3 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((a) => (
            <div key={a.id} className="card p-5">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-32 object-cover rounded-xl mb-3" />}
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-gray text-xs">{TYPES.find((t) => t.value === a.activity_type)?.label ?? a.activity_type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{a.title}</h3>
              {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                {a.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location}</span>}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {a.beneficiaries} benef.</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <p className="text-xs text-slate-400">{new Date(a.activity_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
