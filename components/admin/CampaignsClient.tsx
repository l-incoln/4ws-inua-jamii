'use client'

import { useState, useTransition } from 'react'
import {
  Target, Plus, Edit2, Trash2, Power, Save, X, CheckCircle, AlertCircle,
  TrendingUp, Calendar, DollarSign,
} from 'lucide-react'
import { saveCampaign, toggleCampaignStatus, deleteCampaign } from '@/app/actions/admin'

interface Campaign {
  id: string
  slug: string
  title: string
  description: string | null
  goal: number
  raised: number
  image_url: string | null
  is_active: boolean
  deadline: string | null
  created_at: string
}

export default function CampaignsClient({ campaigns: initial }: { campaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState<string | 'new' | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', goal: '', image_url: '', deadline: '', is_active: 'true',
  })

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  function openNew() {
    setForm({ title: '', description: '', goal: '', image_url: '', deadline: '', is_active: 'true' })
    setEditId('new')
  }

  function openEdit(c: Campaign) {
    setForm({
      title:       c.title,
      description: c.description ?? '',
      goal:        String(c.goal),
      image_url:   c.image_url ?? '',
      deadline:    c.deadline ?? '',
      is_active:   String(c.is_active),
    })
    setEditId(c.id)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    startTransition(async () => {
      const result = await saveCampaign(fd, editId === 'new' ? undefined : (editId ?? undefined))
      if (result?.error) { showToast('error', result.error); return }
      showToast('success', editId === 'new' ? 'Campaign created.' : 'Campaign updated.')
      setEditId(null)
      // Refresh by reloading — in production use router.refresh()
      window.location.reload()
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleCampaignStatus(id, !current)
      if (result?.error) showToast('error', result.error)
      else {
        setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c))
        showToast('success', !current ? 'Campaign activated.' : 'Campaign deactivated.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCampaign(id)
      if (result?.error) showToast('error', result.error)
      else {
        setCampaigns((prev) => prev.filter((c) => c.id !== id))
        showToast('success', 'Campaign deleted.')
      }
      setDeleteConfirm(null)
    })
  }

  const pct = (c: Campaign) => Math.min(100, Math.round((c.raised / c.goal) * 100))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donation Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Create / Edit Form */}
      {editId !== null && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{editId === 'new' ? 'New Campaign' : 'Edit Campaign'}</h2>
            <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label text-xs">Campaign Title *</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Clean Water for Kiambu" />
            </div>
            <div className="md:col-span-2">
              <label className="label text-xs">Description</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will this campaign fund?" />
            </div>
            <div>
              <label className="label text-xs">Fundraising Goal (KES) *</label>
              <input className="input" type="number" min="1" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} required placeholder="500000" />
            </div>
            <div>
              <label className="label text-xs">Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label text-xs">Cover Image URL</label>
              <input className="input" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…/image.jpg" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="label text-xs mb-0">Active</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: form.is_active === 'true' ? 'false' : 'true' })}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active === 'true' ? 'bg-primary-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active === 'true' ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2 border-t border-slate-100">
              <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
                <Save className="w-4 h-4" />{isPending ? 'Saving…' : 'Save Campaign'}
              </button>
              <button type="button" onClick={() => setEditId(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign Cards */}
      {campaigns.length === 0 && !editId && (
        <div className="card p-12 text-center text-slate-400">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm mt-1">Create your first fundraising campaign to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((c) => {
          const progress = pct(c)
          const isOver = new Date(c.deadline ?? '9999-12-31') < new Date()

          return (
            <div key={c.id} className={`card p-5 space-y-4 ${!c.is_active ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {isOver && c.deadline && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Ended</span>}
                  </div>
                  {c.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleToggle(c.id, c.is_active)} disabled={isPending} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors" title={c.is_active ? 'Deactivate' : 'Activate'}>
                    <Power className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium text-slate-700">
                    KES {c.raised.toLocaleString()} raised
                  </span>
                  <span>{progress}% of KES {c.goal.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{progress}% funded</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Goal: KES {c.goal.toLocaleString()}</span>
                {c.deadline && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(c.deadline).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete Campaign?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove the campaign. Existing donation records won&apos;t be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending} className="btn-primary bg-red-600 hover:bg-red-700 text-sm flex-1">
                {isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
