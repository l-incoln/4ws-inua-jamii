'use client'

import { useState, useTransition } from 'react'
import {
  Users, Plus, Edit2, Trash2, CheckSquare, Save, X,
  Calendar, Tag, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
} from 'lucide-react'
import { saveVolunteerTask, deleteVolunteerTask, markTaskComplete } from '@/app/actions/admin'
import type { TaskStatus } from '@/types'

interface Claimer { id: string; full_name: string | null; avatar_url: string | null }
interface Task {
  id: string
  title: string
  description: string | null
  skills_required: string[]
  deadline: string | null
  status: TaskStatus
  claimed_at: string | null
  completed_at: string | null
  created_at: string
  claimer: Claimer | null
}

const STATUS_STYLES: Record<TaskStatus, { cls: string; label: string }> = {
  open:      { cls: 'bg-sky-100 text-sky-700',    label: 'Open' },
  claimed:   { cls: 'bg-amber-100 text-amber-700', label: 'Claimed' },
  completed: { cls: 'bg-green-100 text-green-700', label: 'Completed' },
  cancelled: { cls: 'bg-slate-100 text-slate-500', label: 'Cancelled' },
}

export default function VolunteersClient({ tasks: initial }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState<string | 'new' | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')

  const [form, setForm] = useState({ title: '', description: '', skills_required: '', deadline: '' })

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000)
  }

  function openNew() {
    setForm({ title: '', description: '', skills_required: '', deadline: '' })
    setEditId('new')
  }

  function openEdit(t: Task) {
    setForm({
      title:           t.title,
      description:     t.description ?? '',
      skills_required: t.skills_required?.join(', ') ?? '',
      deadline:        t.deadline ?? '',
    })
    setEditId(t.id)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const result = await saveVolunteerTask(fd, editId === 'new' ? undefined : (editId ?? undefined))
      if (result?.error) { showToast('error', result.error); return }
      showToast('success', editId === 'new' ? 'Task created.' : 'Task updated.')
      setEditId(null)
      window.location.reload()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteVolunteerTask(id)
      if (result?.error) { showToast('error', result.error); return }
      setTasks((prev) => prev.filter((t) => t.id !== id))
      showToast('success', 'Task deleted.')
      setDeleteConfirm(null)
    })
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      const result = await markTaskComplete(id)
      if (result?.error) { showToast('error', result.error); return }
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t))
      showToast('success', 'Task marked complete.')
    })
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const filtered = tasks.filter((t) => filterStatus === 'all' || t.status === filterStatus)

  const counts = (['open', 'claimed', 'completed', 'cancelled'] as TaskStatus[]).reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length
    return acc
  }, {} as Record<TaskStatus, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Volunteer Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {(['open', 'claimed', 'completed', 'cancelled'] as TaskStatus[]).map((s) => {
          const style = STATUS_STYLES[s]
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              className={`card p-3 text-center transition-all ${filterStatus === s ? 'ring-2 ring-primary-500' : ''}`}>
              <p className="text-xl font-bold text-slate-900">{counts[s]}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.cls}`}>{style.label}</span>
            </button>
          )
        })}
      </div>

      {/* Create/Edit form */}
      {editId !== null && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{editId === 'new' ? 'New Task' : 'Edit Task'}</h2>
            <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label text-xs">Task Title *</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Organize tree planting event materials" />
            </div>
            <div className="md:col-span-2">
              <label className="label text-xs">Description</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of what the volunteer needs to do…" />
            </div>
            <div>
              <label className="label text-xs">Skills Required (comma-separated)</label>
              <input className="input" value={form.skills_required} onChange={(e) => setForm({ ...form, skills_required: e.target.value })} placeholder="Driving, Photography, First Aid" />
            </div>
            <div>
              <label className="label text-xs">Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2 border-t border-slate-100">
              <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
                <Save className="w-4 h-4" />{isPending ? 'Saving…' : 'Save Task'}
              </button>
              <button type="button" onClick={() => setEditId(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 && !editId && (
        <div className="card p-12 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No tasks found</p>
          <p className="text-sm mt-1">Create a task for volunteers to claim and complete.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((t) => {
          const style = STATUS_STYLES[t.status]
          const isOpen = expanded.has(t.id)
          const deadlinePassed = t.deadline && new Date(t.deadline) < new Date()

          return (
            <div key={t.id} className="card overflow-hidden">
              <button onClick={() => toggleExpand(t.id)} className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.cls}`}>{style.label}</span>
                    {deadlinePassed && t.status === 'open' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    {t.claimer && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.claimer.full_name ?? 'Unknown'}</span>}
                    {t.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {new Date(t.deadline).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>}
                    {t.skills_required?.length > 0 && (
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{t.skills_required.slice(0, 3).join(', ')}{t.skills_required.length > 3 ? '…' : ''}</span>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100 space-y-4">
                  {t.description && (
                    <p className="text-sm text-slate-700 leading-relaxed">{t.description}</p>
                  )}
                  {t.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {t.skills_required.map((s) => (
                        <span key={s} className="text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                  {t.claimer && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Claimed by:</span>
                      <span className="font-medium text-slate-800">{t.claimer.full_name}</span>
                      {t.claimed_at && <span className="text-xs text-slate-400">at {new Date(t.claimed_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-medium hover:bg-sky-100 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {t.status !== 'completed' && t.status !== 'cancelled' && (
                      <button onClick={() => handleComplete(t.id)} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                        <CheckSquare className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                    )}
                    <button onClick={() => setDeleteConfirm(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete Task?</h3>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending} className="btn-primary bg-red-600 hover:bg-red-700 text-sm flex-1">
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
