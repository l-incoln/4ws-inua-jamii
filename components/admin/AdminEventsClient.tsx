'use client'

import { useState, useTransition } from 'react'
import { saveEvent, deleteEvent, saveEventPartners, saveEventFormFields } from '@/app/actions/admin'
import {
  PlusCircle, Edit2, Trash2, Calendar, MapPin, Users,
  Search, X, AlertCircle, CheckCircle, Clock, Download, ClipboardList, Plus, GripVertical,
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
  rsvp_mode?: string
  external_rsvp_url?: string | null
  external_rsvp_label?: string | null
  rsvp_deadline?: string | null
  requires_login?: boolean
}

type FormFieldDef = {
  id?: string
  field_name: string
  field_label: string
  field_type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date'
  field_options: string[] | null
  is_required: boolean
  sort_order: number
  section_title: string
  section_sort_order: number
}

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  is_active: boolean
}

type PartnerLink = { partner_id: string; contribution: string | null }

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
  rsvp_mode: 'website', external_rsvp_url: '', external_rsvp_label: 'Register on External Form',
  rsvp_deadline: '', requires_login: 'false',
}

const emptyField: FormFieldDef = {
  field_name: '', field_label: '', field_type: 'text', field_options: null, is_required: true, sort_order: 0,
  section_title: 'Additional Information', section_sort_order: 0,
}

export default function AdminEventsClient({
  events: initial,
  partners = [],
  eventPartnerLinks = {},
  eventFormFields = {},
}: {
  events: Event[]
  partners?: Partner[]
  eventPartnerLinks?: Record<string, PartnerLink[]>
  eventFormFields?: Record<string, FormFieldDef[]>
}) {
  const [events, setEvents]         = useState(initial)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState(emptyForm)
  // Selected partners for the event being edited/created:
  // map of partner_id -> optional contribution label.
  const [selectedPartners, setSelectedPartners] = useState<Record<string, string>>({})
  // Custom registration form fields
  const [formFields, setFormFields] = useState<FormFieldDef[]>([])
  const [isPending, startTransition] = useTransition()
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setSelectedPartners({})
    setFormFields([])
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
      rsvp_mode:     event.rsvp_mode ?? 'website',
      external_rsvp_url:   event.external_rsvp_url ?? '',
      external_rsvp_label: event.external_rsvp_label ?? 'Register on External Form',
      rsvp_deadline:       event.rsvp_deadline ? event.rsvp_deadline.slice(0, 16) : '',
      requires_login:      event.requires_login ? 'true' : 'false',
    })
    // Load existing partner links for this event.
    const links = eventPartnerLinks[event.id] ?? []
    const map: Record<string, string> = {}
    for (const l of links) map[l.partner_id] = l.contribution ?? ''
    setSelectedPartners(map)
    // Load existing form fields
    setFormFields(eventFormFields[event.id] ?? [])
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
        return
      }

      // Link partners to the event (new or existing id).
      const eventId = result?.id
      if (eventId) {
        const partnerList = Object.entries(selectedPartners).map(
          ([partner_id, contribution]) => ({ partner_id, contribution: contribution || null }),
        )
        const pr = await saveEventPartners(eventId, partnerList)
        if (pr?.error) {
          showToast('error', `Event saved, but partners failed: ${pr.error}`)
          return
        }

        // Save custom form fields (only for website/hybrid modes)
        if (form.rsvp_mode === 'website' || form.rsvp_mode === 'hybrid') {
          // Compute section_sort_order based on order of unique sections
          const sectionOrder: string[] = []
          formFields.forEach((f) => {
            const s = f.section_title?.trim() || 'Additional Information'
            if (!sectionOrder.includes(s)) sectionOrder.push(s)
          })
          const cleanFields = formFields
            .filter((f) => f.field_name.trim() && f.field_label.trim())
            .map((f, i) => {
              const section = f.section_title?.trim() || 'Additional Information'
              return {
                field_name: f.field_name.trim().replace(/\s+/g, '_').toLowerCase(),
                field_label: f.field_label.trim(),
                field_type: f.field_type,
                field_options: f.field_type === 'select' ? (f.field_options?.filter(Boolean) ?? undefined) : undefined,
                is_required: f.is_required,
                sort_order: i,
                section_title: section,
                section_sort_order: sectionOrder.indexOf(section),
              }
            })
          const fr = await saveEventFormFields(eventId, cleanFields)
          if (fr?.error) {
            showToast('error', `Event saved, but form fields failed: ${fr.error}`)
            return
          }
        }
      }

      showToast('success', editingId ? 'Event updated.' : 'Event created.')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      setSelectedPartners({})
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
                label="Event Banner / Poster Image"
                onChange={(url) => f('image_url', url)}
              />
              <p className="text-xs text-slate-400 mt-1">
                The full image is always shown (no cropping), so portrait posters are fine.
              </p>
            </div>

            {/* Registration Settings */}
            <div className="sm:col-span-2 border-t border-slate-100 pt-4">
              <label className="label text-base font-bold text-slate-900">Registration Settings</label>
              <p className="text-xs text-slate-400 mb-4">
                Configure how people register for this event. The website generates a shareable registration form with QR code by default.
              </p>

              {/* RSVP Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration Mode</label>
                  <select className="input" value={form.rsvp_mode} onChange={(e) => f('rsvp_mode', e.target.value)}>
                    <option value="website">Website Form (primary)</option>
                    <option value="external">External Form only</option>
                    <option value="hybrid">Website + External (hybrid)</option>
                    <option value="none">No registration</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {form.rsvp_mode === 'website' && 'Users fill a form on your website. Registrations are tracked in Supabase.'}
                    {form.rsvp_mode === 'external' && 'Users are redirected to an external form (Google Forms, etc.).'}
                    {form.rsvp_mode === 'hybrid' && 'Users register on your website first, then are directed to the external form.'}
                    {form.rsvp_mode === 'none' && 'Registration is disabled for this event.'}
                  </p>
                </div>

                <div>
                  <label className="label">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.rsvp_deadline}
                    onChange={(e) => f('rsvp_deadline', e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Optional — registration closes after this date/time.</p>
                </div>
              </div>

              {/* External URL (shown for external + hybrid modes) */}
              {(form.rsvp_mode === 'external' || form.rsvp_mode === 'hybrid') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="sm:col-span-2">
                    <label className="label">External Form URL</label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://forms.google.com/…"
                      value={form.external_rsvp_url}
                      onChange={(e) => f('external_rsvp_url', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">External Form Button Label</label>
                    <input
                      className="input"
                      placeholder="Register on External Form"
                      value={form.external_rsvp_label}
                      onChange={(e) => f('external_rsvp_label', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Login requirement */}
              <div className="mt-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requires_login === 'true'}
                    onChange={(e) => f('requires_login', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700">Require login to register</span>
                </label>
                <p className="text-xs text-slate-400 ml-6 mt-1">If enabled, only logged-in members can access the registration form.</p>
              </div>

              {/* Custom form fields with sections (website + hybrid modes) */}
              {(form.rsvp_mode === 'website' || form.rsvp_mode === 'hybrid') && (
                <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-700">Registration Form Builder</span>
                      <p className="text-xs text-slate-400">Organize fields into sections. Name, email, and phone are always included in the first section.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const sectionCount = new Set(formFields.map((f) => f.section_title || 'Additional Information')).size
                        const sectionName = `Section ${sectionCount + 1}`
                        setFormFields((prev) => [...prev, {
                          ...emptyField,
                          field_label: '',
                          field_name: '',
                          sort_order: prev.length,
                          section_title: sectionName,
                          section_sort_order: sectionCount,
                        }])
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Section
                    </button>
                  </div>

                  {formFields.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 italic mb-3">No custom fields yet. The form will collect name, email, and phone only.</p>
                      <button
                        type="button"
                        onClick={() => setFormFields((prev) => [...prev, {
                          ...emptyField,
                          field_label: '',
                          field_name: '',
                          sort_order: 0,
                          section_title: 'Additional Information',
                          section_sort_order: 0,
                        }])}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const sectionNames: string[] = []
                        formFields.forEach((f) => {
                          const s = f.section_title || 'Additional Information'
                          if (!sectionNames.includes(s)) sectionNames.push(s)
                        })
                        return sectionNames.map((sectionName, sIdx) => {
                          const sectionFields = formFields
                            .map((f, i) => ({ f, i }))
                            .filter(({ f }) => (f.section_title || 'Additional Information') === sectionName)
                          return (
                            <div key={sIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100/70 border-b border-slate-200">
                                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={sectionName}
                                  onChange={(e) => {
                                    const newName = e.target.value
                                    setFormFields((prev) => prev.map((f) =>
                                      (f.section_title || 'Additional Information') === sectionName
                                        ? { ...f, section_title: newName }
                                        : f
                                    ))
                                  }}
                                  className="input !py-1 !text-sm font-semibold flex-1 !bg-transparent !border-transparent hover:!bg-white focus:!bg-white transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormFields((prev) => [...prev, {
                                      ...emptyField,
                                      field_label: '',
                                      field_name: '',
                                      sort_order: prev.length,
                                      section_title: sectionName,
                                      section_sort_order: sIdx,
                                    }])
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Field
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormFields((prev) => prev.filter((f) =>
                                      (f.section_title || 'Additional Information') !== sectionName
                                    ))
                                  }}
                                  className="text-red-400 hover:text-red-600 p-1"
                                  title="Remove section and all its fields"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="p-3 space-y-2">
                                {sectionFields.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-1">No fields in this section yet.</p>
                                ) : (
                                  sectionFields.map(({ f, i }) => (
                                    <div key={i} className="flex flex-wrap items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                                      <input
                                        type="text"
                                        placeholder="Field label (e.g. T-shirt size)"
                                        value={f.field_label}
                                        onChange={(e) => setFormFields((prev) => prev.map((ff, j) => j === i ? {
                                          ...ff,
                                          field_label: e.target.value,
                                          field_name: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                                        } : ff))}
                                        className="input !py-1.5 !text-xs flex-1 min-w-[140px]"
                                      />
                                      <select
                                        value={f.field_type}
                                        onChange={(e) => setFormFields((prev) => prev.map((ff, j) => j === i ? { ...ff, field_type: e.target.value as FormFieldDef['field_type'] } : ff))}
                                        className="input !py-1.5 !text-xs w-28"
                                      >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="textarea">Long text</option>
                                        <option value="select">Dropdown</option>
                                        <option value="checkbox">Checkbox</option>
                                      </select>
                                      {f.field_type === 'select' && (
                                        <input
                                          type="text"
                                          placeholder="Options (comma-separated)"
                                          value={(f.field_options ?? []).join(', ')}
                                          onChange={(e) => setFormFields((prev) => prev.map((ff, j) => j === i ? { ...ff, field_options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : ff))}
                                          className="input !py-1.5 !text-xs flex-1 min-w-[120px]"
                                        />
                                      )}
                                      <label className="flex items-center gap-1 text-xs text-slate-600">
                                        <input
                                          type="checkbox"
                                          checked={f.is_required}
                                          onChange={(e) => setFormFields((prev) => prev.map((ff, j) => j === i ? { ...ff, is_required: e.target.checked } : ff))}
                                          className="w-3.5 h-3.5 rounded border-slate-300 text-primary-600"
                                        />
                                        Req
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setFormFields((prev) => prev.filter((_, j) => j !== i))}
                                        className="text-red-400 hover:text-red-600 p-1"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Event partners (optional) */}
            {partners.length > 0 && (
              <div className="sm:col-span-2">
                <label className="label">Event Partners &amp; Sponsors (optional)</label>
                <p className="text-xs text-slate-400 mb-3">
                  Select partners to display on this event&apos;s detail page. Add an optional
                  role/contribution label (e.g. &ldquo;Title Sponsor&rdquo;) for each. The section
                  only appears on the public page when enabled in Settings and at least one partner
                  is linked here.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 p-3 bg-gray-50/50">
                  {partners.map((p) => {
                    const selected = selectedPartners[p.id] !== undefined
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                          selected ? 'border-primary-300 bg-primary-50/60' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              setSelectedPartners((prev) => {
                                const next = { ...prev }
                                if (e.target.checked) next[p.id] = ''
                                else delete next[p.id]
                                return next
                              })
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="font-medium text-sm text-slate-700 truncate">
                            {p.name}
                          </span>
                          {!p.is_active && (
                            <span className="badge-gray text-[10px]">inactive</span>
                          )}
                        </label>
                        {selected && (
                          <input
                            type="text"
                            placeholder="Role (optional)"
                            value={selectedPartners[p.id] ?? ''}
                            onChange={(e) =>
                              setSelectedPartners((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="input !py-1.5 !text-xs w-40 flex-shrink-0"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                {Object.keys(selectedPartners).length > 0 && (
                  <p className="text-xs text-primary-600 mt-2">
                    {Object.keys(selectedPartners).length} partner{Object.keys(selectedPartners).length > 1 ? 's' : ''} linked to this event.
                  </p>
                )}
              </div>
            )}
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
                          <a
                            href={`/admin/events/${event.id}/registrations`}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View registrations"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`/api/admin/export/events/${event.id}`}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Export attendees"
                            download
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
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
