'use client'

import { useState, useTransition } from 'react'
import { Package, Plus, Trash2, Edit2, X, Download } from 'lucide-react'
import { saveDistributionRecord, deleteDistributionRecord } from '@/app/actions/impact-tracking'

interface DistributionRecord {
  id: string
  title: string
  description: string | null
  category: string
  quantity: number
  unit: string
  beneficiaries: number
  location: string | null
  distribution_date: string
  program_id: string | null
}

interface Program { id: string; title: string }

const CATEGORIES = [
  { value: 'food', label: 'Food', icon: '🍚' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'materials', label: 'Materials', icon: '📦' },
  { value: 'medical', label: 'Medical Supplies', icon: '⚕️' },
  { value: 'educational', label: 'Educational Materials', icon: '📚' },
  { value: 'other', label: 'Other', icon: '🎁' },
]

const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.icon]))

export default function DistributionsClient({ records, programs }: { records: DistributionRecord[]; programs: Program[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DistributionRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  const totalBeneficiaries = records.reduce((s, r) => s + r.beneficiaries, 0)
  const totalQuantity = records.reduce((s, r) => s + r.quantity, 0)

  function openNew() { setEditing(null); setShowForm(true) }
  function openEdit(r: DistributionRecord) { setEditing(r); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null) }

  function handleDelete(id: string) {
    if (!confirm('Delete this distribution record?')) return
    startTransition(async () => { await deleteDistributionRecord(id) })
  }

  function handleSubmit(formData: FormData) {
    const id = editing?.id ?? null
    startTransition(async () => { await saveDistributionRecord(id, formData); closeForm() })
  }

  function exportCsv() {
    const headers = ['Date', 'Title', 'Category', 'Quantity', 'Unit', 'Beneficiaries', 'Location', 'Description']
    const rows = records.map((r) => [
      r.distribution_date, r.title, r.category, r.quantity, r.unit, r.beneficiaries, r.location ?? '', r.description ?? '',
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `distributions-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distribution Records</h1>
          <p className="text-slate-500 text-sm mt-1">Track food, clothing, materials, and supplies distributed to communities</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Record
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-slate-900">{records.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Distributions</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-emerald-600">{totalBeneficiaries.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Beneficiaries Reached</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-sky-600">{totalQuantity.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Items Distributed</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-extrabold text-violet-600">{new Set(records.map((r) => r.category)).size}</p>
          <p className="text-xs text-slate-500 mt-0.5">Categories</p>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{editing ? 'Edit Record' : 'New Distribution Record'}</h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Title *</label>
                <input name="title" required defaultValue={editing?.title ?? ''} className="input mt-1" placeholder="Food distribution drive" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Category *</label>
                  <select name="category" required defaultValue={editing?.category ?? 'food'} className="input mt-1">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Date *</label>
                  <input name="distribution_date" type="date" required defaultValue={editing?.distribution_date ?? new Date().toISOString().slice(0, 10)} className="input mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Quantity</label>
                  <input name="quantity" type="number" min="0" defaultValue={editing?.quantity ?? 0} className="input mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Unit</label>
                  <input name="unit" defaultValue={editing?.unit ?? 'items'} className="input mt-1" placeholder="items, kg, boxes" />
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
                <label className="text-xs font-medium text-slate-600">Program (optional)</label>
                <select name="program_id" defaultValue={editing?.program_id ?? ''} className="input mt-1">
                  <option value="">— None —</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Description</label>
                <textarea name="description" rows={2} defaultValue={editing?.description ?? ''} className="input mt-1 resize-none" placeholder="Brief description of the distribution" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isPending} className="btn-primary flex-1 text-sm justify-center">
                  {isPending ? 'Saving...' : editing ? 'Update Record' : 'Create Record'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="card p-6">
        {records.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No distribution records yet.</p>
            <button onClick={openNew} className="btn-primary text-sm mt-3 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 pr-3">Date</th>
                  <th className="pb-3 pr-3">Title</th>
                  <th className="pb-3 pr-3">Category</th>
                  <th className="pb-3 pr-3 text-right">Qty</th>
                  <th className="pb-3 pr-3 text-right">Beneficiaries</th>
                  <th className="pb-3 pr-3">Location</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.distribution_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 pr-3 font-medium text-slate-900">{r.title}</td>
                    <td className="py-3 pr-3">{CATEGORY_ICONS[r.category] ?? '📦'} {CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">{r.quantity.toLocaleString()} {r.unit}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">{r.beneficiaries.toLocaleString()}</td>
                    <td className="py-3 pr-3 text-slate-500">{r.location ?? '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
