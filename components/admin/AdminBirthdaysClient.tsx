'use client'

import { useState, useTransition } from 'react'
import { Cake, Trash2, Edit2, Plus, X, AlertCircle, CheckCircle, Globe, Bell, Search } from 'lucide-react'

type Profile = {
  full_name: string | null
  avatar_url: string | null
  membership_status: string
  role: string
} | null

type BirthdayRow = {
  user_id: string
  birth_date: string
  is_public: boolean
  receive_greetings: boolean
  updated_at: string
  profile: Profile
}

type Member = {
  id: string
  full_name: string | null
  membership_status: string
  role: string
}

type Toast = { type: 'success' | 'error'; msg: string }

function monthDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-KE', { month: 'long', day: 'numeric' })
}

function fullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
}

function daysUntilNext(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const birth = new Date(dateStr + 'T00:00:00')
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < today) next.setFullYear(next.getFullYear() + 1)
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AdminBirthdaysClient({
  rows: initial,
  membersWithoutBirthday,
  adminUpdateBirthday,
  adminDeleteBirthday,
}: {
  rows: BirthdayRow[]
  membersWithoutBirthday: Member[]
  adminUpdateBirthday: (
    userId: string,
    birthDate: string,
    isPublic: boolean,
    receiveGreetings: boolean,
  ) => Promise<{ error?: string; success?: boolean }>
  adminDeleteBirthday: (userId: string) => Promise<{ error?: string; success?: boolean }>
}) {
  const [isPending, start] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'greetings'>('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Edit form state
  const [formDate, setFormDate] = useState('')
  const [formPublic, setFormPublic] = useState(false)
  const [formGreetings, setFormGreetings] = useState(true)

  // Add form state
  const [addUserId, setAddUserId] = useState('')
  const [addDate, setAddDate] = useState('')
  const [addPublic, setAddPublic] = useState(false)
  const [addGreetings, setAddGreetings] = useState(true)

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4500) }

  const openEdit = (row: BirthdayRow) => {
    setEditId(row.user_id)
    setFormDate(row.birth_date)
    setFormPublic(row.is_public)
    setFormGreetings(row.receive_greetings)
    setShowAddForm(false)
  }

  const openAdd = () => {
    setShowAddForm(true)
    setEditId(null)
    setAddUserId('')
    setAddDate('')
    setAddPublic(false)
    setAddGreetings(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId || !formDate) return
    start(async () => {
      const result = await adminUpdateBirthday(editId, formDate, formPublic, formGreetings)
      if (result?.error) showToast({ type: 'error', msg: result.error })
      else {
        showToast({ type: 'success', msg: 'Birthday updated.' })
        setEditId(null)
      }
    })
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUserId || !addDate) {
      showToast({ type: 'error', msg: 'Select a member and a birth date.' })
      return
    }
    start(async () => {
      const result = await adminUpdateBirthday(addUserId, addDate, addPublic, addGreetings)
      if (result?.error) showToast({ type: 'error', msg: result.error })
      else {
        showToast({ type: 'success', msg: 'Birthday added.' })
        setShowAddForm(false)
      }
    })
  }

  const handleDelete = (userId: string) => {
    if (!confirm('Delete this birthday record? The member can re-add it later.')) return
    setDeleteId(userId)
    start(async () => {
      const result = await adminDeleteBirthday(userId)
      if (result?.error) showToast({ type: 'error', msg: result.error })
      else showToast({ type: 'success', msg: 'Birthday deleted.' })
      setDeleteId(null)
      if (editId === userId) setEditId(null)
    })
  }

  // Filter + search
  const filtered = initial.filter((row) => {
    if (filter === 'public' && !row.is_public) return false
    if (filter === 'private' && row.is_public) return false
    if (filter === 'greetings' && !row.receive_greetings) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const name = row.profile?.full_name ?? ''
      if (!name.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Sort by upcoming birthday (closest first)
  const sorted = [...filtered].sort((a, b) => daysUntilNext(a.birth_date) - daysUntilNext(b.birth_date))

  const stats = {
    total: initial.length,
    public: initial.filter((r) => r.is_public).length,
    greetings: initial.filter((r) => r.receive_greetings).length,
    upcoming30: initial.filter((r) => daysUntilNext(r.birth_date) <= 30).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Birthdays</h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats.total} records · {stats.public} public · {stats.greetings} receiving greetings · {stats.upcoming30} in next 30 days
          </p>
        </div>
        <button onClick={openAdd} disabled={membersWithoutBirthday.length === 0} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add Birthday
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

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'public', 'private', 'greetings'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                filter === f ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {f === 'greetings' ? 'Greetings on' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card p-5 border-2 border-primary-200 bg-primary-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Cake className="w-4 h-4 text-primary-600" /> Add Birthday
            </h2>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Member <span className="text-red-500">*</span></label>
              <select className="input" value={addUserId} onChange={(e) => setAddUserId(e.target.value)} required>
                <option value="">Select a member without a birthday…</option>
                {membersWithoutBirthday.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? 'Unnamed'} {m.role === 'admin' ? '· admin' : ''} {m.role === 'volunteer' ? '· volunteer' : ''}
                  </option>
                ))}
              </select>
              {membersWithoutBirthday.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">All members already have a birthday set.</p>
              )}
            </div>
            <div>
              <label className="label">Birth Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" value={addDate} onChange={(e) => setAddDate(e.target.value)} required />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={addPublic} onChange={(e) => setAddPublic(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <Globe className="w-3.5 h-3.5" /> Public
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={addGreetings} onChange={(e) => setAddGreetings(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <Bell className="w-3.5 h-3.5" /> Greetings
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={isPending} className="btn-primary text-sm">
                {isPending ? 'Saving…' : 'Add Birthday'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form */}
      {editId && (
        <div className="card p-5 border-2 border-sky-200 bg-sky-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-sky-600" /> Edit Birthday
            </h2>
            <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Birth Date <span className="text-red-500">*</span></label>
              <input type="date" className="input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={formPublic} onChange={(e) => setFormPublic(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <Globe className="w-3.5 h-3.5" /> Public
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={formGreetings} onChange={(e) => setFormGreetings(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                <Bell className="w-3.5 h-3.5" /> Greetings
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={isPending} className="btn-primary text-sm">
                {isPending ? 'Saving…' : 'Update'}
              </button>
              <button type="button" onClick={() => setEditId(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <Cake className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No birthdays found</p>
          <p className="text-slate-400 text-sm mt-1">
            {initial.length === 0 ? 'Members can set their own birthday from dashboard settings.' : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((row) => {
            const days = daysUntilNext(row.birth_date)
            const isToday = days === 0
            const isUpcoming = days <= 30
            return (
              <div key={row.user_id} className={`card p-4 flex items-center gap-4 ${isToday ? 'border-l-4 border-l-pink-500' : ''}`}>
                {/* Avatar / cake */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isToday ? 'bg-pink-100 text-pink-600' : isUpcoming ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Cake className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 truncate">
                      {row.profile?.full_name ?? 'Unnamed member'}
                    </span>
                    {row.profile?.role === 'admin' && <span className="badge-sky text-[10px]">admin</span>}
                    {row.profile?.role === 'volunteer' && <span className="badge-sky text-[10px]">volunteer</span>}
                    {row.profile?.membership_status !== 'approved' && (
                      <span className="text-[10px] text-amber-600 font-medium capitalize">{row.profile?.membership_status}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                    <span>{monthDay(row.birth_date)}</span>
                    <span className="text-slate-300">·</span>
                    <span>{fullDate(row.birth_date)}</span>
                    {isToday ? (
                      <span className="text-pink-600 font-medium">🎂 Today!</span>
                    ) : (
                      <span className={isUpcoming ? 'text-amber-600 font-medium' : ''}>in {days} days</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] mt-1">
                    {row.is_public ? (
                      <span className="flex items-center gap-1 text-emerald-600"><Globe className="w-3 h-3" /> Public</span>
                    ) : (
                      <span className="text-slate-400">Private</span>
                    )}
                    {row.receive_greetings ? (
                      <span className="flex items-center gap-1 text-sky-600"><Bell className="w-3 h-3" /> Greetings on</span>
                    ) : (
                      <span className="text-slate-400">No greetings</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(row)}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                    title="Edit"
                    aria-label={`Edit birthday for ${row.profile?.full_name ?? 'member'}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.user_id)}
                    disabled={deleteId === row.user_id && isPending}
                    className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    title="Delete"
                    aria-label={`Delete birthday for ${row.profile?.full_name ?? 'member'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
