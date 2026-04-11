'use client'

import { useState, useTransition } from 'react'
import { PlusCircle, Pin, PinOff, Trash2, Edit2, Megaphone, X, CheckCircle, AlertCircle } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  body: string | null
  is_pinned: boolean
  created_at: string
}

type Toast = { type: 'success' | 'error'; msg: string }

export default function AnnouncementsClient({
  announcements: initial,
  saveAnnouncement,
  deleteAnnouncement,
}: {
  announcements: Announcement[]
  saveAnnouncement: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
  deleteAnnouncement: (id: string) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [isPending, start]  = useTransition()
  const [actionId, setActionId]   = useState<string | null>(null)
  const [toast, setToast]   = useState<Toast | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)

  // Form state
  const [formTitle, setFormTitle]  = useState('')
  const [formBody,  setFormBody]   = useState('')
  const [formPinned, setFormPinned] = useState(false)

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4000) }

  const openCreate = () => {
    setEditTarget(null)
    setFormTitle(''); setFormBody(''); setFormPinned(false)
    setShowForm(true)
  }

  const openEdit = (a: Announcement) => {
    setEditTarget(a)
    setFormTitle(a.title); setFormBody(a.body ?? ''); setFormPinned(a.is_pinned)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set('title', formTitle)
    fd.set('body', formBody)
    fd.set('is_pinned', String(formPinned))

    start(async () => {
      const result = await saveAnnouncement(fd, editTarget?.id)
      if (result?.error) {
        showToast({ type: 'error', msg: result.error as string })
      } else {
        showToast({ type: 'success', msg: editTarget ? 'Announcement updated.' : 'Announcement created.' })
        setShowForm(false)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this announcement?')) return
    setActionId(id)
    start(async () => {
      const result = await deleteAnnouncement(id)
      if (result?.error) showToast({ type: 'error', msg: result.error as string })
      setActionId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">
            {initial.length} announcement{initial.length !== 1 ? 's' : ''} ·{' '}
            {initial.filter((a) => a.is_pinned).length} pinned
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="card p-5 border-2 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">
              {editTarget ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title <span className="text-red-500">*</span></label>
              <input
                required
                className="input"
                placeholder="e.g. Monthly Meeting — June 2026"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Body <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Provide more details about the announcement…"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pin-check"
                checked={formPinned}
                onChange={(e) => setFormPinned(e.target.checked)}
                className="w-4 h-4 accent-primary-600 cursor-pointer"
              />
              <label htmlFor="pin-check" className="text-sm text-slate-700 cursor-pointer select-none">
                Pin to top of member feed
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isPending} className="btn-primary text-sm">
                {isPending ? 'Saving…' : editTarget ? 'Update' : 'Publish'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {initial.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No announcements yet</p>
          <p className="text-slate-400 text-sm mt-1">Create one to notify your members</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((a) => (
            <div key={a.id} className={`card p-5 transition-all ${a.is_pinned ? 'border-l-4 border-l-primary-500' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    a.is_pinned ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {a.is_pinned ? <Pin className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{a.title}</h3>
                      {a.is_pinned && (
                        <span className="badge-sky text-xs">pinned</span>
                      )}
                    </div>
                    {a.body && <p className="text-sm text-slate-500 mt-1">{a.body}</p>}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(a.created_at).toLocaleDateString('en-KE', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={actionId === a.id && isPending}
                    className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
