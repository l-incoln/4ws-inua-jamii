'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, UserCheck, UserX, Search, Calendar, MapPin,
  Users, CheckCircle2, XCircle, Clock, Download,
} from 'lucide-react'
import { checkInAttendee } from '@/app/actions/admin'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}

interface Rsvp {
  id: string
  status: string
  checked_in: boolean
  checked_in_at: string | null
  created_at: string
  profiles: Profile | null
}

interface Event {
  id: string
  title: string
  event_date: string
  start_time: string | null
  location: string | null
  max_attendees: number | null
}

export default function AttendanceClient({ event, rsvps: initial }: { event: Event; rsvps: Rsvp[] }) {
  const [rsvps, setRsvps] = useState(initial)
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const confirmed = rsvps.filter((r) => r.status === 'confirmed')
  const checkedIn = rsvps.filter((r) => r.checked_in)

  const filtered = confirmed.filter((r) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      r.profiles?.full_name?.toLowerCase().includes(q) ||
      r.profiles?.email?.toLowerCase().includes(q)
    )
  })

  function toast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function toggleCheckIn(rsvpId: string, current: boolean) {
    setLoadingId(rsvpId)
    startTransition(async () => {
      const result = await checkInAttendee(rsvpId, !current)
      if (result?.error) { toast(result.error); setLoadingId(null); return }
      setRsvps((prev) => prev.map((r) => r.id === rsvpId
        ? { ...r, checked_in: !current, checked_in_at: !current ? new Date().toISOString() : null }
        : r
      ))
      toast(!current ? 'Checked in!' : 'Check-in removed.')
      setLoadingId(null)
    })
  }

  function exportCSV() {
    const header = 'Name,Email,Phone,Checked In,Check-in Time'
    const rows = confirmed.map((r) =>
      `"${r.profiles?.full_name ?? ''}","${r.profiles?.email ?? ''}","${r.profiles?.phone ?? ''}","${r.checked_in ? 'Yes' : 'No'}","${r.checked_in_at ?? ''}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/\s+/g, '-')}-attendance.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const eventDateStr = new Date(event.event_date).toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance: {event.title}</h1>
            <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{eventDateStr}</span>
              {event.start_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.start_time}</span>}
              {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>}
            </div>
          </div>
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-2 flex-shrink-0">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Confirmed RSVPs', value: confirmed.length, icon: Users, color: 'text-sky-600 bg-sky-50' },
          { label: 'Checked In', value: checkedIn.length, icon: UserCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Not Arrived', value: confirmed.length - checkedIn.length, icon: UserX, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-2.5">
          {toastMsg}
        </div>
      )}

      {/* Attendee list */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Attendee</th>
              <th className="px-5 py-3 text-left hidden sm:table-cell">Email</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Check-in Time</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  {query ? 'No attendees match your search.' : 'No confirmed RSVPs yet.'}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${r.checked_in ? 'bg-green-50/30' : ''}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {r.profiles?.avatar_url ? (
                      <img src={r.profiles.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {r.profiles?.full_name?.[0] ?? '?'}
                      </div>
                    )}
                    <span className="font-medium text-slate-900">{r.profiles?.full_name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{r.profiles?.email ?? '—'}</td>
                <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                  {r.checked_in_at
                    ? new Date(r.checked_in_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td className="px-5 py-3.5 text-center">
                  {r.checked_in
                    ? <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle2 className="w-4 h-4" />In</span>
                    : <span className="inline-flex items-center gap-1 text-slate-400 text-xs"><XCircle className="w-4 h-4" />Pending</span>
                  }
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => toggleCheckIn(r.id, r.checked_in)}
                    disabled={isPending && loadingId === r.id}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      r.checked_in
                        ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {loadingId === r.id ? '…' : r.checked_in ? 'Undo' : 'Check In'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
