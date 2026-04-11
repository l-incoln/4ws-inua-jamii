'use client'

import { useState, useTransition } from 'react'
import { saveEvent, deleteEvent } from '@/app/actions/admin'
import {
  PlusCircle, Edit2, Trash2, Calendar, MapPin, Users,
  Search, X, AlertCircle, CheckCircle, Clock,
} from 'lucide-react'
import ImageUpload from './ImageUpload'

type Event = {
  id: string
  title: string
  slug: string | null
  description: string | null
  location: string
  address: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  image_url: string | null
  category: string | null
  max_attendees: number | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  rsvp_count?: number
}

const CATEGORIES = ['Health', 'Education', 'Economic', 'Environment', 'Empowerment', 'Fundraiser', 'Community']

const statusColors: Record<string, string> = {
  upcoming:  'badge-green',
  ongoing:   'bg-sky-100 text-sky-800 badge',
  completed: 'badge-gray',
  cancelled: 'badge-red',
}

const emptyForm = {
  title: '', description: '', location: '', address: '',
  event_date: '', start_time: '', end_time: '',
  image_url: '', category: 'Health', max_attendees: '', status: 'upcoming',
}

export default function AdminEventsClient({ events: initial }: { events: Event[] }) {
  const [events, setEvents]         = useState(initial)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState(emptyForm)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (event: Event) => {
    setForm({
      title:         event.title,
      description:   event.description ?? '',
      location:      event.location,
      address:       event.address ?? '',
      event_date:    event.event_date,
      start_time:    event.start_time ?? '',
      end_time:      event.end_time ?? '',
      image_url:     event.image_url ?? '',
      category:      event.category ?? 'Health',
      max_attendees: event.max_attendees?.toString() ?? '',
      status:        event.status,
    })
    setEditingId(event.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })

    startTransition(async () => {
      const result = await saveEvent(fd, editingId ?? undefined)
      if (result?.error) {
        showToast('error', result.error)
      } else {
        showToast('success', editingId ? 'Event updated.' : 'Event created.')
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
        // Optimistic refresh: update local state
        if (editingId) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === editingId
                ? {
                    ...e,
                    title:    form.title,
                    location: form.location,
                    event_date: form.event_date,
                    category: form.category,
                    status:   form.status as Event['status'],
                    image_url: form.image_url || null,
                    max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
                  }
                : e
            )
          )
        } else {
          // Add a temporary placeholder (will be replaced on next server render)
          setEvents((prev) => [
            {
              id:           'temp-' + Date.now(),
              title:        form.title,
              slug:         null,
              description:  form.description || null,
              location:     form.location,
              address:      form.address || null,
              event_date:   form.event_date,
              start_time:   form.start_time || null,
              end_time:     form.end_time || null,
              image_url:    form.image_url || null,
              category:     form.category || null,
              max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
              status:       form.status as Event['status'],
            },
            ...prev,
          ])
        }
      }
    })
  }

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteEvent(id)
      if (result?.error) {
        showToast('error', result.error)
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== id))
        showToast('success', 'Event deleted.')
      }
    })
  }

  const f = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }))

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Management</h1>
          <p className="text-slate-500 text-sm mt-1">{events.length} total events</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm" disabled={isPending}>
          <PlusCircle className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 border-2 border-primary-200 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">
              {editingId ? 'Edit Event' : 'New Event'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="label">Event Title *</label>
              <input className="input" placeholder="e.g. Community Health Fair 2026" value={form.title} onChange={(e) => f('title', e.target.value)} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="What will happen at this event?" value={form.description} onChange={(e) => f('description', e.target.value)} />
            </div>

            {/* Date */}
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.event_date} onChange={(e) => f('event_date', e.target.value)} />
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => f('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Start time */}
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.start_time} onChange={(e) => f('start_time', e.target.value)} />
            </div>

            {/* End time */}
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.end_time} onChange={(e) => f('end_time', e.target.value)} />
            </div>

            {/* Location */}
            <div>
              <label className="label">Venue / Location *</label>
              <input className="input" placeholder="e.g. Nairobi Community Center" value={form.location} onChange={(e) => f('location', e.target.value)} />
            </div>

            {/* Address */}
            <div>
              <label className="label">Address (optional)</label>
              <input className="input" placeholder="Physical address or directions" value={form.address} onChange={(e) => f('address', e.target.value)} />
            </div>

            {/* Max attendees */}
            <div>
              <label className="label">Max Attendees</label>
              <input type="number" className="input" placeholder="e.g. 200" value={form.max_attendees} onChange={(e) => f('max_attendees', e.target.value)} />
            </div>

            {/* Status */}
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => f('status', e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Image upload */}
            <div className="sm:col-span-2">
              <ImageUpload
                name="image_url"
                defaultValue={form.image_url}
                folder="events"
                label="Event Banner Image"
                onChange={(url) => f('image_url', url)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !form.title || !form.location || !form.event_date}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isPending ? 'Saving…' : editingId ? 'Update Event' : 'Create Event'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Events table */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No events found</p>
          <button onClick={openCreate} className="btn-primary text-sm mt-4 inline-flex">
            <PlusCircle className="w-4 h-4" /> Create First Event
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-3.5 text-left">Event</th>
                  <th className="px-5 py-3.5 text-left">Date & Time</th>
                  <th className="px-5 py-3.5 text-left">Category</th>
                  <th className="px-5 py-3.5 text-left">Capacity</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((event) => {
                  const rsvpCount = event.rsvp_count ?? 0
                  const maxCap    = event.max_attendees ?? 0
                  const pct       = maxCap > 0 ? Math.round((rsvpCount / maxCap) * 100) : 0
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">{event.title}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {new Date(event.event_date).toLocaleDateString('en-KE', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                        {event.start_time && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {event.start_time}
                            {event.end_time ? ` – ${event.end_time}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className="badge-gray text-xs">{event.category ?? '—'}</span>
                      </td>
                      <td className="table-cell">
                        {maxCap > 0 ? (
                          <div className="min-w-[100px]">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{rsvpCount}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">of {maxCap}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Open</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`${statusColors[event.status] ?? 'badge-gray'} text-xs`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(event)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id, event.title)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
