'use client'

import { useState, useTransition } from 'react'
import {
  Globe, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin,
  Wallet, BarChart3, Info, CheckCircle, AlertCircle, Edit2, Save
} from 'lucide-react'

type Metric = {
  id: string
  label: string
  value: number
  unit: string | null
  sort_order: number
}

type Toast = { type: 'success' | 'error'; msg: string }

const tabs = ['Site Info', 'Socials & Contact', 'Payments', 'Impact Metrics'] as const
type Tab = typeof tabs[number]

export default function AdminSettingsClient({
  settings,
  metrics,
  saveSiteSettings,
  saveImpactMetric,
}: {
  settings: Record<string, string>
  metrics: Metric[]
  saveSiteSettings: (fd: FormData) => Promise<{ error?: unknown; success?: boolean }>
  saveImpactMetric: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [tab, setTab]       = useState<Tab>('Site Info')
  const [isPending, start]  = useTransition()
  const [toast, setToast]   = useState<Toast | null>(null)
  const [editMetricId, setEditMetricId] = useState<string | null>(null)

  // Site settings form state
  const [s, setS] = useState({ ...settings })

  // Metric edit state
  const [mLabel, setMLabel] = useState('')
  const [mValue, setMValue] = useState('')
  const [mUnit,  setMUnit]  = useState('')
  const [mOrder, setMOrder] = useState('')

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4000) }

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const result = await saveSiteSettings(fd)
      if (result?.error) showToast({ type: 'error', msg: result.error as string })
      else showToast({ type: 'success', msg: 'Settings saved successfully.' })
    })
  }

  const openMetricEdit = (m: Metric) => {
    setEditMetricId(m.id)
    setMLabel(m.label); setMValue(String(m.value)); setMUnit(m.unit ?? ''); setMOrder(String(m.sort_order))
  }

  const handleSaveMetric = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set('label', mLabel)
    fd.set('value', mValue)
    fd.set('unit', mUnit)
    fd.set('sort_order', mOrder)
    start(async () => {
      const result = await saveImpactMetric(fd, editMetricId ?? undefined)
      if (result?.error) showToast({ type: 'error', msg: result.error as string })
      else { showToast({ type: 'success', msg: 'Metric updated.' }); setEditMetricId(null) }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your website content, contact details, and display data.</p>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSaveSettings}>
        {/* ── Site Info ── */}
        {tab === 'Site Info' && (
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Organisation Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site / Organisation Name" icon={<Globe className="w-3.5 h-3.5" />}>
                <input name="site_name" className="input" value={s.site_name ?? ''} onChange={(e) => setS({ ...s, site_name: e.target.value })} placeholder="4W'S Inua Jamii Foundation" />
              </Field>
              <Field label="Tagline">
                <input name="tagline" className="input" value={s.tagline ?? ''} onChange={(e) => setS({ ...s, tagline: e.target.value })} placeholder="Transforming Communities" />
              </Field>
            </div>
            <div>
              <label className="label">Mission Statement</label>
              <textarea name="about_mission" rows={3} className="input resize-none" value={s.about_mission ?? ''} onChange={(e) => setS({ ...s, about_mission: e.target.value })} placeholder="Our mission is to…" />
            </div>
            <div>
              <label className="label">Vision Statement</label>
              <textarea name="about_vision" rows={2} className="input resize-none" value={s.about_vision ?? ''} onChange={(e) => setS({ ...s, about_vision: e.target.value })} placeholder="Our vision is…" />
            </div>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Socials & Contact ── */}
        {tab === 'Socials & Contact' && (
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Contact Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Contact Email" icon={<Mail className="w-3.5 h-3.5" />}>
                <input name="contact_email" type="email" className="input" value={s.contact_email ?? ''} onChange={(e) => setS({ ...s, contact_email: e.target.value })} placeholder="info@example.org" />
              </Field>
              <Field label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                <input name="contact_phone" className="input" value={s.contact_phone ?? ''} onChange={(e) => setS({ ...s, contact_phone: e.target.value })} placeholder="+254 700 000 000" />
              </Field>
              <Field label="Physical Address" icon={<MapPin className="w-3.5 h-3.5" />} className="md:col-span-2">
                <input name="address" className="input" value={s.address ?? ''} onChange={(e) => setS({ ...s, address: e.target.value })} placeholder="Nairobi, Kenya" />
              </Field>
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-primary-600" />
                <h2 className="font-semibold text-slate-900">Social Media Links</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'facebook_url',  label: 'Facebook',  icon: <Facebook className="w-3.5 h-3.5" />, placeholder: 'https://facebook.com/…' },
                  { key: 'twitter_url',   label: 'X / Twitter', icon: <Twitter className="w-3.5 h-3.5" />, placeholder: 'https://x.com/…' },
                  { key: 'instagram_url', label: 'Instagram',  icon: <Instagram className="w-3.5 h-3.5" />, placeholder: 'https://instagram.com/…' },
                  { key: 'youtube_url',   label: 'YouTube',    icon: <Youtube className="w-3.5 h-3.5" />, placeholder: 'https://youtube.com/…' },
                  { key: 'linkedin_url',  label: 'LinkedIn',   icon: <Linkedin className="w-3.5 h-3.5" />, placeholder: 'https://linkedin.com/…' },
                ].map(({ key, label, icon, placeholder }) => (
                  <Field key={key} label={label} icon={icon}>
                    <input
                      name={key}
                      type="url"
                      className="input"
                      value={(s as any)[key] ?? ''}
                      onChange={(e) => setS({ ...s, [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </Field>
                ))}
              </div>
            </div>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Payments ── */}
        {tab === 'Payments' && (
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Payment Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="M-Pesa Paybill Number">
                <input name="mpesa_paybill" className="input" value={s.mpesa_paybill ?? ''} onChange={(e) => setS({ ...s, mpesa_paybill: e.target.value })} placeholder="400200" />
              </Field>
              <Field label="M-Pesa Account Number">
                <input name="mpesa_account" className="input" value={s.mpesa_account ?? ''} onChange={(e) => setS({ ...s, mpesa_account: e.target.value })} placeholder="INUAJAMII" />
              </Field>
              <Field label="Bank Name">
                <input name="bank_name" className="input" value={s.bank_name ?? ''} onChange={(e) => setS({ ...s, bank_name: e.target.value })} placeholder="Equity Bank" />
              </Field>
              <Field label="Bank Account Number">
                <input name="bank_account" className="input" value={s.bank_account ?? ''} onChange={(e) => setS({ ...s, bank_account: e.target.value })} placeholder="0123456789" />
              </Field>
            </div>
            <SaveBar isPending={isPending} />
          </div>
        )}
      </form>

      {/* ── Impact Metrics ── (separate form per metric) */}
      {tab === 'Impact Metrics' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-900">Homepage Impact Stats</h2>
          </div>
          <p className="text-sm text-slate-500">These numbers appear on your homepage impact section.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map((m) => (
              <div key={m.id} className="card p-5">
                {editMetricId === m.id ? (
                  <form onSubmit={handleSaveMetric} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Label</label>
                        <input className="input text-sm" value={mLabel} onChange={(e) => setMLabel(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label text-xs">Value</label>
                        <input className="input text-sm" type="number" value={mValue} onChange={(e) => setMValue(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label text-xs">Unit</label>
                        <input className="input text-sm" value={mUnit} onChange={(e) => setMUnit(e.target.value)} placeholder="e.g. +" />
                      </div>
                      <div>
                        <label className="label text-xs">Display Order</label>
                        <input className="input text-sm" type="number" value={mOrder} onChange={(e) => setMOrder(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={isPending} className="btn-primary text-xs flex items-center gap-1.5">
                        <Save className="w-3 h-3" /> {isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditMetricId(null)} className="btn-secondary text-xs">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary-700">
                        {m.value.toLocaleString()}{m.unit}
                      </div>
                      <div className="text-sm font-medium text-slate-700 mt-0.5">{m.label}</div>
                    </div>
                    <button
                      onClick={() => openMetricEdit(m)}
                      className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  className = '',
  children,
}: {
  label: string
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="label flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  )
}

function SaveBar({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex justify-end pt-2 border-t border-slate-100">
      <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
        <Save className="w-4 h-4" />
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
