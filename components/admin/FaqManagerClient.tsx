'use client'

import { useState, useTransition } from 'react'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  HelpCircle, CheckCircle, AlertCircle, X, Save,
} from 'lucide-react'

type Faq = {
  id: string
  question: string
  answer: string
  category: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

type Toast = { type: 'success' | 'error'; msg: string }

const CATEGORIES = [
  { value: 'about',        label: 'About the Foundation' },
  { value: 'membership',   label: 'Membership' },
  { value: 'donations',    label: 'Donations' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'privacy',      label: 'Privacy & Data' },
  { value: 'general',      label: 'General' },
]

const catLabel = (cat: string | null) =>
  CATEGORIES.find((c) => c.value === (cat ?? 'general'))?.label ?? cat ?? 'General'

const emptyForm = { question: '', answer: '', category: 'general', sort_order: '0', is_active: 'true' }

export default function FaqManagerClient({
  initialFaqs,
  saveFaq,
  deleteFaq,
  toggleFaqStatus,
}: {
  initialFaqs: Faq[]
  saveFaq: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
  deleteFaq: (id: string) => Promise<{ error?: unknown; success?: boolean }>
  toggleFaqStatus: (id: string, isActive: boolean) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [faqs, setFaqs]               = useState<Faq[]>(initialFaqs)
  const [showForm, setShowForm]       = useState(false)
  const [editId, setEditId]           = useState<string | null>(null)
  const [form, setForm]               = useState({ ...emptyForm })
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [filterCat, setFilterCat]     = useState<string>('all')
  const [toast, setToast]             = useState<Toast | null>(null)
  const [isPending, start]            = useTransition()

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4500) }

  const openNew = () => {
    setEditId(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  const openEdit = (faq: Faq) => {
    setEditId(faq.id)
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category ?? 'general',
      sort_order: String(faq.sort_order),
      is_active: String(faq.is_active),
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))
    start(async () => {
      const result = await saveFaq(fd, editId ?? undefined)
      if (result?.error) {
        showToast({ type: 'error', msg: result.error as string })
      } else {
        showToast({ type: 'success', msg: editId ? 'FAQ updated.' : 'FAQ created.' })
        setShowForm(false)
        // Refresh list by updating local state optimistically
        const updated: Faq = {
          id: editId ?? Math.random().toString(),
          question: form.question,
          answer: form.answer,
          category: form.category,
          sort_order: Number(form.sort_order),
          is_active: form.is_active === 'true',
          created_at: new Date().toISOString(),
        }
        if (editId) {
          setFaqs((prev) => prev.map((f) => f.id === editId ? updated : f))
        } else {
          setFaqs((prev) => [...prev, updated].sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.sort_order - b.sort_order))
        }
      }
    })
  }

  const handleDelete = (id: string) => {
    start(async () => {
      const result = await deleteFaq(id)
      if (result?.error) {
        showToast({ type: 'error', msg: result.error as string })
      } else {
        setFaqs((prev) => prev.filter((f) => f.id !== id))
        showToast({ type: 'success', msg: 'FAQ deleted.' })
        setDeleteId(null)
      }
    })
  }

  const handleToggle = (faq: Faq) => {
    start(async () => {
      const result = await toggleFaqStatus(faq.id, !faq.is_active)
      if (result?.error) {
        showToast({ type: 'error', msg: result.error as string })
      } else {
        setFaqs((prev) => prev.map((f) => f.id === faq.id ? { ...f, is_active: !faq.is_active } : f))
      }
    })
  }

  const displayed = filterCat === 'all' ? faqs : faqs.filter((f) => (f.category ?? 'general') === filterCat)

  // Group for display
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: displayed.filter((f) => (f.category ?? 'general') === cat.value),
  })).filter((g) => g.items.length > 0)

  const otherItems = displayed.filter((f) => !CATEGORIES.some((c) => c.value === (f.category ?? 'general')))
  if (otherItems.length > 0) grouped.push({ value: 'other', label: 'Other', items: otherItems })

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-slate-900">Delete this FAQ?</h3>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={isPending} className="btn-primary text-sm px-4 py-2 bg-red-600 hover:bg-red-700">
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FAQ Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage frequently asked questions displayed on the public FAQ page.</p>
        </div>
        <button onClick={openNew} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600" />
              {editId ? 'Edit FAQ' : 'New FAQ'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label text-xs">Question *</label>
              <input
                className="input"
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                placeholder="How can I become a member?"
                required
              />
            </div>
            <div>
              <label className="label text-xs">Answer *</label>
              <textarea
                rows={5}
                className="input resize-none"
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                placeholder="Provide a clear, concise answer…"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label text-xs">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Sort Order</label>
                <input
                  type="number"
                  className="input"
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                  min={0}
                />
              </div>
              <div>
                <label className="label text-xs">Status</label>
                <select
                  className="input"
                  value={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value }))}
                >
                  <option value="true">Active</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2">
                <Save className="w-3.5 h-3.5" />
                {isPending ? 'Saving…' : (editId ? 'Update FAQ' : 'Create FAQ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterCat === 'all' ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          All ({faqs.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = faqs.filter((f) => (f.category ?? 'general') === cat.value).length
          if (!count) return null
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCat(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterCat === cat.value ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* FAQ List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No FAQs yet. Click &quot;Add FAQ&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.value}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3 px-1">{group.label}</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {group.items.map((faq) => (
                  <div key={faq.id} className={`p-5 flex items-start gap-4 ${!faq.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{faq.question}</p>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2">{faq.answer}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold">{catLabel(faq.category)}</span>
                        <span className="text-[10px] text-slate-400">Order: {faq.sort_order}</span>
                        <span className={`text-[10px] font-semibold ${faq.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {faq.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        title={faq.is_active ? 'Hide' : 'Show'}
                        onClick={() => handleToggle(faq)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        {faq.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        title="Edit"
                        onClick={() => openEdit(faq)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteId(faq.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
