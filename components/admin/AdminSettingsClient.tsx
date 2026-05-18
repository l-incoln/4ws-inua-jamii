'use client'

import { useState, useTransition, useRef } from 'react'
import {
  Globe, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin,
  Wallet, BarChart3, Info, CheckCircle, AlertCircle, Edit2, Save,
  Search, Users, Bell, Home, Calendar, CalendarDays, Scale, CreditCard,
  Upload, ImageIcon, Loader2, Plus, Trash2, X, Link2, Heart,
} from 'lucide-react'
import Image from 'next/image'

type Metric = {
  id: string
  label: string
  value: number
  unit: string | null
  sort_order: number
}

type LeadershipMember = {
  id: string
  name: string
  role: string
  bio: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

type GalleryItem = {
  id: string
  image_url: string
  title: string | null
}

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  sort_order: number
  is_active: boolean
}

type AwarenessDay = {
  id: string
  name: string
  description: string | null
  month: number | null
  day: number | null
  specific_date: string | null
  category: string
  priority: string
  icon_emoji: string | null
  banner_message: string | null
  link_url: string | null
  link_label: string | null
  is_active: boolean
}

type Toast = { type: 'success' | 'error'; msg: string }

const tabs = [
  'Site Info',
  'Contact & Socials',
  'Payments',
  'SEO & Metadata',
  'Membership',
  'Email & Notifications',
  'Homepage',
  'Awareness Calendar',
  'Partners & Sponsors',
  'Core Values',
  'Events & RSVP',
  'Legal & Footer',
  'Impact Metrics',
  'Our Team',
  'About Page',
  'Donate Page',
  'FAQ Page',
] as const
type Tab = typeof tabs[number]

export default function AdminSettingsClient({
  settings,
  metrics,
  leadership: initialLeadership,
  galleryItems,
  mediaItems,
  partners,
  awarenessInitial,
  saveSiteSettings,
  saveImpactMetric,
  uploadSiteImage,
  saveLeadershipMember,
  deleteLeadershipMember,
  savePartner,
  deletePartner,
  saveAwarenessDay,
  deleteAwarenessDay,
}: {
  settings: Record<string, string>
  metrics: Metric[]
  leadership: LeadershipMember[]
  galleryItems: GalleryItem[]
  mediaItems: GalleryItem[]
  partners: Partner[]
  awarenessInitial: AwarenessDay[]
  saveSiteSettings: (fd: FormData) => Promise<{ error?: unknown; success?: boolean }>
  saveImpactMetric: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
  uploadSiteImage: (fd: FormData, key: 'logo_url' | 'hero_image_url' | 'og_image_url' | 'volunteer_photo_1' | 'volunteer_photo_2' | 'volunteer_photo_3') => Promise<{ error?: unknown; url?: string }>
  saveLeadershipMember: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
  deleteLeadershipMember: (id: string) => Promise<{ error?: unknown; success?: boolean }>
  savePartner: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
  deletePartner: (id: string) => Promise<{ error?: unknown; success?: boolean }>
  saveAwarenessDay: (fd: FormData, id?: string) => Promise<{ error?: unknown; success?: boolean }>
  deleteAwarenessDay: (id: string) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [tab, setTab]      = useState<Tab>('Site Info')
  const [isPending, start] = useTransition()
  const [toast, setToast]  = useState<Toast | null>(null)
  const [editMetricId, setEditMetricId] = useState<string | null>(null)

  const [s, setS] = useState({ ...settings })

  const [mLabel, setMLabel] = useState('')
  const [mValue, setMValue] = useState('')
  const [mUnit,  setMUnit]  = useState('')
  const [mOrder, setMOrder] = useState('')

  // Image upload state
  const [logoUploading, setLogoUploading]     = useState(false)
  const [heroUploading, setHeroUploading]     = useState(false)
  const [vol1Uploading, setVol1Uploading]     = useState(false)
  const [vol2Uploading, setVol2Uploading]     = useState(false)
  const [vol3Uploading, setVol3Uploading]     = useState(false)
  const logoInputRef  = useRef<HTMLInputElement>(null)
  const heroInputRef  = useRef<HTMLInputElement>(null)
  const vol1InputRef  = useRef<HTMLInputElement>(null)
  const vol2InputRef  = useRef<HTMLInputElement>(null)
  const vol3InputRef  = useRef<HTMLInputElement>(null)

  // Gallery picker state (for volunteer section photos + story image)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [galleryPickerKey, setGalleryPickerKey]   = useState<string | null>(null)
  const [galleryPickerSource, setGalleryPickerSource] = useState<'gallery' | 'media'>('gallery')
  const [gallerySearch, setGallerySearch]         = useState('')

  // Leadership team state
  const [leadershipList, setLeadershipList] = useState<LeadershipMember[]>(initialLeadership)
  const [showLeadershipForm, setShowLeadershipForm] = useState(false)
  const [editLeaderId, setEditLeaderId] = useState<string | null>(null)
  const [leaderForm, setLeaderForm] = useState({ name: '', role: '', bio: '', image_url: '', sort_order: '0', is_active: 'true' })
  const [leaderSaving, setLeaderSaving] = useState(false)
  const [leaderDeleteId, setLeaderDeleteId] = useState<string | null>(null)

  // Partners state
  const [partnerList, setPartnerList] = useState<Partner[]>(partners)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [editPartnerId, setEditPartnerId] = useState<string | null>(null)
  const [partnerForm, setPartnerForm] = useState({ name: '', logo_url: '', website_url: '', sort_order: '0', is_active: 'true' })
  const [partnerSaving, setPartnerSaving] = useState(false)
  const [partnerDeleteId, setPartnerDeleteId] = useState<string | null>(null)

  // Awareness days state
  const blankAwareness = { name: '', description: '', date_type: 'annual', month: '', day: '', specific_date: '', category: 'international', priority: 'medium', icon_emoji: '📅', banner_message: '', link_url: '', link_label: '', is_active: 'true' }
  const [awarenessList, setAwarenessList] = useState<AwarenessDay[]>(awarenessInitial)
  const [showAwarenessForm, setShowAwarenessForm] = useState(false)
  const [editAwarenessId, setEditAwarenessId] = useState<string | null>(null)
  const [awarenessForm, setAwarenessForm] = useState(blankAwareness)
  const [awarenessSaving, setAwarenessSaving] = useState(false)
  const [awarenessDeleteId, setAwarenessDeleteId] = useState<string | null>(null)
  const [awarenessFilter, setAwarenessFilter] = useState<string>('all')

  const handleImageUpload = async (
    file: File,
    key: 'logo_url' | 'hero_image_url' | 'volunteer_photo_1' | 'volunteer_photo_2' | 'volunteer_photo_3',
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true)
    const fd = new FormData()
    fd.set('file', file)
    const result = await uploadSiteImage(fd, key as Parameters<typeof uploadSiteImage>[1])
    setUploading(false)
    if (result?.error) {
      showToast({ type: 'error', msg: result.error as string })
    } else if (result?.url) {
      set(key, result.url)
      showToast({ type: 'success', msg: 'Image updated successfully.' })
    }
  }

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4500) }

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const result = await saveSiteSettings(fd)
      if (result?.error) showToast({ type: 'error', msg: result.error as string })
      else showToast({ type: 'success', msg: 'Settings saved successfully.' })
    })
  }

  const set = (key: string, val: string) => setS((prev) => ({ ...prev, [key]: val }))
  const toggle = (key: string) => setS((prev) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))

  const openMetricEdit = (m: Metric) => {
    setEditMetricId(m.id)
    setMLabel(m.label); setMValue(String(m.value)); setMUnit(m.unit ?? ''); setMOrder(String(m.sort_order))
  }

  const handleSaveMetric = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set('label', mLabel); fd.set('value', mValue); fd.set('unit', mUnit); fd.set('sort_order', mOrder)
    start(async () => {
      const result = await saveImpactMetric(fd, editMetricId ?? undefined)
      if (result?.error) showToast({ type: 'error', msg: result.error as string })
      else { showToast({ type: 'success', msg: 'Metric updated.' }); setEditMetricId(null) }
    })
  }

  const tabGroups: { label: string; tabs: Tab[] }[] = [
    { label: 'Organisation', tabs: ['Site Info', 'Contact & Socials', 'Legal & Footer'] },
    { label: 'Platform',     tabs: ['Membership', 'Events & RSVP', 'Homepage', 'Awareness Calendar'] },
    { label: 'Integrations', tabs: ['Payments', 'Email & Notifications', 'SEO & Metadata'] },
    { label: 'Display',      tabs: ['Impact Metrics', 'Our Team', 'Partners & Sponsors', 'Core Values'] },
    { label: 'Pages',        tabs: ['About Page', 'Donate Page', 'FAQ Page'] },
  ]

  const openGalleryPicker = (key: string, source: 'gallery' | 'media' = 'gallery') => {
    setGalleryPickerKey(key)
    setGalleryPickerSource(source)
    setGallerySearch('')
    setGalleryPickerOpen(true)
  }

  const pickerItems = galleryPickerSource === 'media' ? mediaItems : galleryItems
  const filteredGallery = pickerItems.filter((g) =>
    !gallerySearch || (g.title ?? '').toLowerCase().includes(gallerySearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Gallery Picker Modal */}
      {galleryPickerOpen && galleryPickerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setGalleryPickerOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Pick from {galleryPickerSource === 'media' ? 'Media Library' : 'Media Gallery'}</h3>
              <button type="button" onClick={() => setGalleryPickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-slate-100">
              <input
                className="input text-sm w-full"
                placeholder="Search by title…"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              {filteredGallery.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No gallery images found.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filteredGallery.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="relative h-24 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary-500 focus:border-primary-600 focus:outline-none transition-all group"
                      onClick={() => { set(galleryPickerKey, g.image_url); setGalleryPickerOpen(false) }}
                    >
                      <Image src={g.image_url} alt={g.title ?? ''} fill className="object-cover" unoptimized />
                      {g.title && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {g.title}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your website, platform behaviour, and integrations.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-100'
            : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
            : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Tab navigation — grouped */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-3">
        {tabGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest px-2 mb-1.5">{group.label}</p>
            <div className="flex flex-wrap gap-1">
              {group.tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    tab === t
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* All settings in one shared form — hidden inputs carry values for inactive tabs */}
      <form onSubmit={handleSaveSettings}>
        {Object.entries(s).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v ?? ''} />
        ))}

        {/* ── Site Info ── */}
        {tab === 'Site Info' && (
          <Section icon={<Info />} title="Organisation Information">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="label">Organisation Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                  {s.logo_url ? (
                    <Image src={s.logo_url} alt="Logo" width={80} height={80} className="object-contain w-full h-full" unoptimized />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-slate-500">Upload your logo (PNG, SVG, or WebP recommended). It will appear in the navbar and footer across all pages.</p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, 'logo_url', setLogoUploading)
                    }}
                  />
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                  >
                    {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {logoUploading ? 'Uploading…' : 'Upload Logo'}
                  </button>
                  {s.logo_url && (
                    <button type="button" onClick={() => set('logo_url', '')} className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
              </div>
              {/* Hidden input so logo_url is included in the save form */}
              <input type="hidden" name="logo_url" value={s.logo_url ?? ''} />
            </div>

            {/* Logo size slider */}
            <div className="space-y-1.5">
              <label className="label">Logo Display Size</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  name="logo_size"
                  min="24"
                  max="80"
                  step="4"
                  value={s.logo_size ?? '36'}
                  onChange={(e) => set('logo_size', e.target.value)}
                  className="flex-1 accent-primary-600"
                />
                <span className="text-sm font-semibold text-slate-600 w-14 text-right">{s.logo_size ?? '36'}px</span>
              </div>
              <p className="text-xs text-slate-400">Controls logo size in the navbar and footer (24–80 px). Default is 36 px.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Organisation Name" icon={<Globe className="w-3.5 h-3.5" />}>
                <input name="site_name" className="input" value={s.site_name ?? ''} onChange={(e) => set('site_name', e.target.value)} placeholder="4W'S Inua Jamii Foundation" />
              </Field>
              <Field label="Tagline">
                <input name="tagline" className="input" value={s.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Transforming Communities" />
              </Field>
            </div>
            <Field label="Mission Statement">
              <textarea name="about_mission" rows={3} className="input resize-none" value={s.about_mission ?? ''} onChange={(e) => set('about_mission', e.target.value)} placeholder="Our mission is to…" />
            </Field>
            <Field label="Vision Statement">
              <textarea name="about_vision" rows={2} className="input resize-none" value={s.about_vision ?? ''} onChange={(e) => set('about_vision', e.target.value)} placeholder="Our vision is…" />
            </Field>
            <SaveBar isPending={isPending} />
          </Section>
        )}

        {/* ── Contact & Socials ── */}
        {tab === 'Contact & Socials' && (
          <div className="space-y-4">
            <Section icon={<Phone />} title="Contact Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact Email" icon={<Mail className="w-3.5 h-3.5" />}>
                  <input name="contact_email" type="email" className="input" value={s.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value)} placeholder="info@example.org" />
                </Field>
                <Field label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                  <input name="contact_phone" className="input" value={s.contact_phone ?? ''} onChange={(e) => set('contact_phone', e.target.value)} placeholder="+254 700 000 000" />
                </Field>
                <Field label="Physical Address" icon={<MapPin className="w-3.5 h-3.5" />} className="md:col-span-2">
                  <input name="address" className="input" value={s.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Nairobi, Kenya" />
                </Field>
              </div>
            </Section>
            <Section icon={<Globe />} title="Social Media Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'facebook_url',  label: 'Facebook',    icon: <Facebook className="w-3.5 h-3.5" />,  placeholder: 'https://facebook.com/…' },
                  { key: 'twitter_url',   label: 'X / Twitter', icon: <Twitter className="w-3.5 h-3.5" />,   placeholder: 'https://x.com/…' },
                  { key: 'instagram_url', label: 'Instagram',   icon: <Instagram className="w-3.5 h-3.5" />, placeholder: 'https://instagram.com/…' },
                  { key: 'youtube_url',   label: 'YouTube',     icon: <Youtube className="w-3.5 h-3.5" />,   placeholder: 'https://youtube.com/…' },
                  { key: 'linkedin_url',  label: 'LinkedIn',    icon: <Linkedin className="w-3.5 h-3.5" />,  placeholder: 'https://linkedin.com/…' },
                  { key: 'tiktok_url',    label: 'TikTok',      icon: <span className="w-3.5 h-3.5 font-bold text-xs leading-none">TT</span>, placeholder: 'https://tiktok.com/@…' },
                  { key: 'whatsapp_url',  label: 'WhatsApp Channel', icon: <span className="w-3.5 h-3.5 font-bold text-xs leading-none">WA</span>, placeholder: 'https://whatsapp.com/channel/…' },
                ].map(({ key, label, icon, placeholder }) => (
                  <Field key={key} label={label} icon={icon}>
                    <input name={key} type="url" className="input" value={(s as Record<string, string>)[key] ?? ''} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
                  </Field>
                ))}
              </div>
            </Section>
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
                <Save className="w-4 h-4" />{isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── Payments ── */}
        {tab === 'Payments' && (
          <div className="space-y-4">
            <Section icon={<Wallet />} title="M-Pesa">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Paybill / Till Number">
                  <input name="mpesa_paybill" className="input" value={s.mpesa_paybill ?? ''} onChange={(e) => set('mpesa_paybill', e.target.value)} placeholder="400200" />
                </Field>
                <Field label="Account Number">
                  <input name="mpesa_account" className="input" value={s.mpesa_account ?? ''} onChange={(e) => set('mpesa_account', e.target.value)} placeholder="INUAJAMII" />
                </Field>
                <Field label="Shortcode Type">
                  <select name="mpesa_shortcode_type" className="input" value={s.mpesa_shortcode_type ?? 'paybill'} onChange={(e) => set('mpesa_shortcode_type', e.target.value)}>
                    <option value="paybill">Paybill</option>
                    <option value="till">Buy Goods (Till)</option>
                  </select>
                </Field>
              </div>
            </Section>
            <Section icon={<CreditCard />} title="Bank Transfer">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Bank Name">
                  <input name="bank_name" className="input" value={s.bank_name ?? ''} onChange={(e) => set('bank_name', e.target.value)} placeholder="Equity Bank" />
                </Field>
                <Field label="Bank Account Number">
                  <input name="bank_account" className="input" value={s.bank_account ?? ''} onChange={(e) => set('bank_account', e.target.value)} placeholder="0123456789" />
                </Field>
              </div>
            </Section>
            <Section icon={<Wallet />} title="Donation Defaults">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Currency">
                  <select name="donation_currency" className="input" value={s.donation_currency ?? 'KES'} onChange={(e) => set('donation_currency', e.target.value)}>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </Field>
                <Field label="Minimum Donation Amount">
                  <input name="min_donation_amount" type="number" min="1" className="input" value={s.min_donation_amount ?? '100'} onChange={(e) => set('min_donation_amount', e.target.value)} placeholder="100" />
                </Field>
                <Field label="Receipt BCC Email" icon={<Mail className="w-3.5 h-3.5" />} className="md:col-span-2">
                  <input name="donation_receipts_email" type="email" className="input" value={s.donation_receipts_email ?? ''} onChange={(e) => set('donation_receipts_email', e.target.value)} placeholder="finance@example.org" />
                  <p className="text-xs text-slate-400 mt-1">BCC&apos;d on every completed donation receipt email.</p>
                </Field>
                <Field label="Thank-You Message" className="md:col-span-2">
                  <textarea name="donation_thank_you_message" rows={3} className="input resize-none" value={s.donation_thank_you_message ?? ''} onChange={(e) => set('donation_thank_you_message', e.target.value)} placeholder="Thank you for your generous donation…" />
                </Field>
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── SEO & Metadata ── */}
        {tab === 'SEO & Metadata' && (
          <div className="space-y-4">
            <Section icon={<Search />} title="Search Engine Optimisation">
              <Field label="Default Meta Description">
                <textarea name="meta_description" rows={3} className="input resize-none" value={s.meta_description ?? ''} onChange={(e) => set('meta_description', e.target.value)} placeholder="Empowering communities across Kenya…" />
                <p className="text-xs text-slate-400 mt-1">Shown in Google search results. Keep under 160 characters.</p>
              </Field>
              <Field label="Default Open Graph Image URL">
                <input name="og_image_url" type="url" className="input" value={s.og_image_url ?? ''} onChange={(e) => set('og_image_url', e.target.value)} placeholder="https://…/og-image.jpg" />
                <p className="text-xs text-slate-400 mt-1">Shown when pages are shared on social media. Recommended: 1200×630px.</p>
              </Field>
            </Section>
            <Section icon={<BarChart3 />} title="Analytics & Tracking">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Google Analytics 4 ID">
                  <input name="google_analytics_id" className="input font-mono text-sm" value={s.google_analytics_id ?? ''} onChange={(e) => set('google_analytics_id', e.target.value)} placeholder="G-XXXXXXXXXX" />
                </Field>
                <Field label="Google Tag Manager ID">
                  <input name="google_tag_manager_id" className="input font-mono text-sm" value={s.google_tag_manager_id ?? ''} onChange={(e) => set('google_tag_manager_id', e.target.value)} placeholder="GTM-XXXXXXX" />
                </Field>
                <Field label="Meta / Facebook Pixel ID">
                  <input name="facebook_pixel_id" className="input font-mono text-sm" value={s.facebook_pixel_id ?? ''} onChange={(e) => set('facebook_pixel_id', e.target.value)} placeholder="123456789012345" />
                </Field>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                Analytics IDs are injected into the site layout automatically. Leave blank to disable tracking.
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Membership ── */}
        {tab === 'Membership' && (
          <div className="space-y-4">
            <Section icon={<Users />} title="Registration Controls">
              <div className="space-y-4">
                <ToggleField
                  label="Allow New Signups"
                  description="When off, the signup page shows a closed message and new accounts cannot be created."
                  value={s.new_signups_enabled !== 'false'}
                  onToggle={() => toggle('new_signups_enabled')}
                  name="new_signups_enabled"
                />
                <ToggleField
                  label="Auto-Approve New Members"
                  description="When on, members are automatically approved on signup. When off, an admin must manually approve each application."
                  value={s.auto_approve_members === 'true'}
                  onToggle={() => toggle('auto_approve_members')}
                  name="auto_approve_members"
                />
              </div>
            </Section>
            <Section icon={<CreditCard />} title="Membership Fees">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Currency">
                  <select name="membership_currency" className="input" value={s.membership_currency ?? 'KES'} onChange={(e) => set('membership_currency', e.target.value)}>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {[
                  { key: 'membership_fee_basic',    label: 'Classic (Basic) Fee' },
                  { key: 'membership_fee_active',   label: 'Premium (Active) Fee' },
                  { key: 'membership_fee_champion', label: 'Gold (Champion) Fee' },
                ].map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        {s.membership_currency || 'KES'}
                      </span>
                      <input
                        name={key}
                        type="number"
                        min="0"
                        className="input pl-12"
                        value={(s as Record<string, string>)[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </Field>
                ))}
              </div>
              <p className="text-xs text-slate-400">These amounts are displayed to members as reference — payment is processed via M-Pesa or bank transfer.</p>
            </Section>
            <Section icon={<Calendar />} title="Membership Duration (Years)">
              <p className="text-xs text-slate-500 -mt-1 mb-2">Default membership validity period per tier (in years). Admins can override per issuance.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'membership_duration_basic',    label: 'Classic (Basic)' },
                  { key: 'membership_duration_active',   label: 'Premium (Active)' },
                  { key: 'membership_duration_champion', label: 'Gold (Champion)' },
                ].map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <div className="relative">
                      <input
                        name={key}
                        type="number"
                        min="1"
                        max="10"
                        className="input pr-12"
                        value={(s as Record<string, string>)[key] ?? '1'}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">yr(s)</span>
                    </div>
                  </Field>
                ))}
              </div>
            </Section>
            <Section icon={<Bell />} title="Admin Notifications">
              <div className="space-y-3">
                <ToggleField
                  label="Notify admin on new member registration"
                  description="Sends an in-app notification when a new member registers and is pending approval."
                  value={s.admin_notify_new_member !== 'false'}
                  onToggle={() => toggle('admin_notify_new_member')}
                  name="admin_notify_new_member"
                />
                <ToggleField
                  label="Notify admin on new donation"
                  description="Sends an in-app notification whenever a donation is completed."
                  value={s.admin_notify_new_donation !== 'false'}
                  onToggle={() => toggle('admin_notify_new_donation')}
                  name="admin_notify_new_donation"
                />
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Email & Notifications ── */}
        {tab === 'Email & Notifications' && (
          <div className="space-y-4">
            <Section icon={<Mail />} title="Sender Identity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="From Email Address">
                  <input name="from_email" type="email" className="input" value={s.from_email ?? ''} onChange={(e) => set('from_email', e.target.value)} placeholder="no-reply@example.org" />
                </Field>
                <Field label="From Name">
                  <input name="from_name" className="input" value={s.from_name ?? ''} onChange={(e) => set('from_name', e.target.value)} placeholder="4W'S Inua Jamii Foundation" />
                </Field>
                <Field label="Admin Notification Email" icon={<Bell className="w-3.5 h-3.5" />} className="md:col-span-2">
                  <input name="admin_notify_email" type="email" className="input" value={s.admin_notify_email ?? ''} onChange={(e) => set('admin_notify_email', e.target.value)} placeholder="admin@example.org" />
                  <p className="text-xs text-slate-400 mt-1">Receives alerts for new member signups, donations, and contact messages.</p>
                </Field>
              </div>
            </Section>
            <Section icon={<Bell />} title="Welcome Email">
              <div className="space-y-4">
                <ToggleField
                  label="Send Welcome Email on Signup"
                  description="Automatically emails new members after they create an account."
                  value={s.welcome_email_enabled !== 'false'}
                  onToggle={() => toggle('welcome_email_enabled')}
                  name="welcome_email_enabled"
                />
                <Field label="Welcome Email Body">
                  <textarea
                    name="welcome_email_body"
                    rows={5}
                    className="input resize-none"
                    value={s.welcome_email_body ?? ''}
                    onChange={(e) => set('welcome_email_body', e.target.value)}
                    placeholder="Welcome to the 4W'S Inua Jamii community…"
                    disabled={s.welcome_email_enabled === 'false'}
                  />
                </Field>
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Homepage ── */}
        {tab === 'Homepage' && (
          <div className="space-y-4">
            <Section icon={<Home />} title="Hero Section">
              <div className="grid grid-cols-1 gap-4">
                {/* Hero Background Image */}
                <div className="space-y-2">
                  <label className="label">Hero Background Image</label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                      {s.hero_image_url ? (
                        <Image src={s.hero_image_url} alt="Hero" width={128} height={80} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-slate-500">Optional background image for the hero section. Leave empty for the default animated gradient.</p>
                      <input
                        ref={heroInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, 'hero_image_url', setHeroUploading)
                        }}
                      />
                      <button
                        type="button"
                        disabled={heroUploading}
                        onClick={() => heroInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                      >
                        {heroUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {heroUploading ? 'Uploading…' : 'Upload Image'}
                      </button>
                      {s.hero_image_url && (
                        <button type="button" onClick={() => set('hero_image_url', '')} className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                  <input type="hidden" name="hero_image_url" value={s.hero_image_url ?? ''} />
                </div>

                <Field label="Badge / Announcement Text">
                  <input name="hero_badge_text" className="input" value={s.hero_badge_text ?? ''} onChange={(e) => set('hero_badge_text', e.target.value)} placeholder="Transforming Communities Across Kenya" />
                </Field>
                <Field label="Hero Headline">
                  <input name="hero_title" className="input" value={s.hero_title ?? ''} onChange={(e) => set('hero_title', e.target.value)} placeholder="Empowering Communities Across Kenya" />
                </Field>
                <Field label="Hero Subtitle">
                  <textarea name="hero_subtitle" rows={3} className="input resize-none" value={s.hero_subtitle ?? ''} onChange={(e) => set('hero_subtitle', e.target.value)} placeholder="We combine grassroots passion with strategic programming…" />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="CTA Button Label">
                    <input name="hero_cta_label" className="input" value={s.hero_cta_label ?? ''} onChange={(e) => set('hero_cta_label', e.target.value)} placeholder="Join Our Mission" />
                  </Field>
                  <Field label="CTA Button URL">
                    <input name="hero_cta_url" className="input" value={s.hero_cta_url ?? ''} onChange={(e) => set('hero_cta_url', e.target.value)} placeholder="/auth/signup" />
                  </Field>
                </div>
              </div>
            </Section>
            <Section icon={<Home />} title="Section Visibility">
              <div className="space-y-4">
                <ToggleField
                  label="Show Impact Stats Section"
                  description="Displays the animated impact counter row on the homepage."
                  value={s.show_impact_stats !== 'false'}
                  onToggle={() => toggle('show_impact_stats')}
                  name="show_impact_stats"
                />
                <ToggleField
                  label="Show Upcoming Events Preview"
                  description="Displays the next 3 upcoming events on the homepage."
                  value={s.show_events_preview !== 'false'}
                  onToggle={() => toggle('show_events_preview')}
                  name="show_events_preview"
                />
              </div>
            </Section>
            <Section icon={<Users />} title="Volunteer Section (About Page)">
              <div className="grid grid-cols-1 gap-4">
                <Field label="Section Title">
                  <input name="volunteer_title" className="input" value={s.volunteer_title ?? ''} onChange={(e) => set('volunteer_title', e.target.value)} placeholder="Volunteer With Us" />
                </Field>
                <Field label="Section Subtitle">
                  <textarea name="volunteer_subtitle" rows={2} className="input resize-none" value={s.volunteer_subtitle ?? ''} onChange={(e) => set('volunteer_subtitle', e.target.value)} placeholder="Your time and skills can transform lives..." />
                </Field>
                <Field label="Volunteer Count Callout">
                  <input name="volunteer_count" className="input" value={s.volunteer_count ?? ''} onChange={(e) => set('volunteer_count', e.target.value)} placeholder="350+" />
                </Field>
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Awareness Calendar ── */}
        {tab === 'Awareness Calendar' && (
          <div className="space-y-4">
            <Section icon={<CalendarDays />} title="Awareness Banner">
              <div className="space-y-5">
                <ToggleField
                  label="Show Awareness Banner on Homepage"
                  description="Displays a themed banner below the hero section when today matches a national, international, or foundation observance day."
                  value={s.show_awareness_banner !== 'false'}
                  onToggle={() => toggle('show_awareness_banner')}
                  name="show_awareness_banner"
                />
                <div className="pt-1">
                  <label className="label">Minimum Priority to Show</label>
                  <p className="text-xs text-slate-400 mb-2">Only awareness days at or above this priority will appear in the homepage banner.</p>
                  <select
                    name="awareness_min_priority"
                    className="input"
                    value={s.awareness_min_priority ?? 'medium'}
                    onChange={(e) => set('awareness_min_priority', e.target.value)}
                  >
                    <option value="high">High only — major national & international days</option>
                    <option value="medium">Medium &amp; above — recommended (default)</option>
                    <option value="low">All — every observance day including low priority</option>
                  </select>
                  <input type="hidden" name="awareness_min_priority" value={s.awareness_min_priority ?? 'medium'} />
                </div>
              </div>
            </Section>
            <Section icon={<Calendar />} title="How It Works">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 space-y-2">
                <p>The Intelligent Calendar system automatically surfaces awareness days based on today&apos;s date.</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
                  <li><strong>Homepage banner</strong> — dismissable colour-coded strip below the hero, showing today&apos;s observances.</li>
                  <li><strong>Member dashboard greeting</strong> — personalised card acknowledging today&apos;s day and upcoming observances within 7 days.</li>
                  <li><strong>Admin overview widget</strong> — scrollable list of the next 30 days&apos; awareness days with priority badges.</li>
                </ul>
                <p className="text-xs text-slate-400 pt-1">Use the <strong>Awareness Days</strong> manager below to add, edit, or deactivate individual days.</p>
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Partners & Sponsors (inside form for show_partners_section toggle) ── */}
        {tab === 'Partners & Sponsors' && (
          <div className="space-y-4">
            <Section icon={<Link2 />} title="Partners Section Settings">
              <ToggleField
                label="Show Partners Section on Homepage"
                description="Displays logos of partner organisations and sponsors in a strip on the homepage."
                value={s.show_partners_section !== 'false'}
                onToggle={() => toggle('show_partners_section')}
                name="show_partners_section"
              />
              <Field label="Section Title">
                <input name="partners_section_title" className="input" value={s.partners_section_title ?? ''} onChange={(e) => set('partners_section_title', e.target.value)} placeholder="Our Partners & Supporters" />
              </Field>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Core Values (inside form) ── */}
        {tab === 'Core Values' && (
          <div className="space-y-4">
            <Section icon={<Heart />} title="Core Values">
              <p className="text-xs text-slate-500 -mt-1 mb-2">These six values appear on the About page. Edit titles and descriptions here.</p>
              <div className="grid grid-cols-1 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Value {n}</p>
                    <Field label="Title">
                      <input
                        name={`core_value_${n}_title`}
                        className="input"
                        value={(s as Record<string, string>)[`core_value_${n}_title`] ?? ''}
                        onChange={(e) => set(`core_value_${n}_title`, e.target.value)}
                        placeholder={`Core Value ${n} Title`}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        name={`core_value_${n}_body`}
                        rows={2}
                        className="input resize-none"
                        value={(s as Record<string, string>)[`core_value_${n}_body`] ?? ''}
                        onChange={(e) => set(`core_value_${n}_body`, e.target.value)}
                        placeholder="Brief description of this core value…"
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {tab === 'Events & RSVP' && (
          <div className="space-y-4">
            <Section icon={<Calendar />} title="RSVP Settings">
              <div className="space-y-4">
                <ToggleField
                  label="Enable RSVPs Globally"
                  description="Master switch. When off, all RSVP buttons are hidden and no new RSVPs can be made."
                  value={s.rsvp_enabled !== 'false'}
                  onToggle={() => toggle('rsvp_enabled')}
                  name="rsvp_enabled"
                />
                <ToggleField
                  label="Require Login to RSVP"
                  description="When off, guests can RSVP without an account. When on, members must be logged in."
                  value={s.rsvp_require_login !== 'false'}
                  onToggle={() => toggle('rsvp_require_login')}
                  name="rsvp_require_login"
                />
                <Field label="Event Reminder Lead Time">
                  <div className="flex items-center gap-3">
                    <input
                      name="event_reminder_days"
                      type="number"
                      min="0"
                      max="30"
                      className="input w-24"
                      value={s.event_reminder_days ?? '2'}
                      onChange={(e) => set('event_reminder_days', e.target.value)}
                    />
                    <span className="text-sm text-slate-500">days before the event</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">How many days in advance reminder emails are sent to confirmed attendees.</p>
                </Field>
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Legal & Footer ── */}
        {tab === 'Legal & Footer' && (
          <div className="space-y-4">
            <Section icon={<Scale />} title="Legal Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Privacy Policy URL">
                  <input name="privacy_policy_url" type="url" className="input" value={s.privacy_policy_url ?? ''} onChange={(e) => set('privacy_policy_url', e.target.value)} placeholder="https://example.org/privacy" />
                </Field>
                <Field label="Terms & Conditions URL">
                  <input name="terms_url" type="url" className="input" value={s.terms_url ?? ''} onChange={(e) => set('terms_url', e.target.value)} placeholder="https://example.org/terms" />
                </Field>
              </div>
            </Section>
            <Section icon={<Globe />} title="Footer Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="NGO Registration Number">
                  <input name="registration_number" className="input" value={s.registration_number ?? ''} onChange={(e) => set('registration_number', e.target.value)} placeholder="OP.218/051/23-454/13476" />
                  <p className="text-xs text-slate-400 mt-1">Displayed in the site footer for legal compliance.</p>
                </Field>
                <Field label="Footer Tagline">
                  <input name="footer_tagline" className="input" value={s.footer_tagline ?? ''} onChange={(e) => set('footer_tagline', e.target.value)} placeholder="Transforming communities, one life at a time." />
                </Field>
              </div>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── About Page ── */}
        {tab === 'About Page' && (
          <div className="space-y-4">
            <Section icon={<Info />} title="Hero Section">
              <Field label="Hero Subtitle">
                <textarea name="about_hero_subtitle" rows={3} className="input resize-none" value={s.about_hero_subtitle ?? ''} onChange={(e) => set('about_hero_subtitle', e.target.value)} placeholder="Founded on the belief that every community deserves to thrive…" />
                <p className="text-xs text-slate-400 mt-1">Short tagline shown below the page title on the About page.</p>
              </Field>
            </Section>
            <Section icon={<Info />} title="Our Story Section">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Established / Year Badge">
                  <input name="about_established" className="input" value={s.about_established ?? ''} onChange={(e) => set('about_established', e.target.value)} placeholder="Est. 2018" />
                  <p className="text-xs text-slate-400 mt-1">Text on the story image overlay.</p>
                </Field>
                <Field label="City">
                  <input name="about_city" className="input" value={s.about_city ?? ''} onChange={(e) => set('about_city', e.target.value)} placeholder="Nairobi, Kenya" />
                  <p className="text-xs text-slate-400 mt-1">City shown below the established badge.</p>
                </Field>
              </div>
              <Field label="Story Paragraph 1">
                <textarea name="about_story_p1" rows={4} className="input resize-none" value={s.about_story_p1 ?? ''} onChange={(e) => set('about_story_p1', e.target.value)} placeholder="4W'S Inua Jamii Foundation was born in 2018…" />
              </Field>
              <Field label="Story Paragraph 2">
                <textarea name="about_story_p2" rows={4} className="input resize-none" value={s.about_story_p2 ?? ''} onChange={(e) => set('about_story_p2', e.target.value)} placeholder="What started as neighborhood clean-up drives…" />
              </Field>
              <Field label="Story Paragraph 3">
                <textarea name="about_story_p3" rows={3} className="input resize-none" value={s.about_story_p3 ?? ''} onChange={(e) => set('about_story_p3', e.target.value)} placeholder="Today, we operate with a professional team…" />
              </Field>
              <Field label="Story Section Image">
                <p className="text-xs text-slate-400 mb-2">Image shown beside the story text. Pick from the media gallery.</p>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                    {s.about_story_image ? (
                      <Image src={s.about_story_image} alt="Story image" fill className="object-cover" unoptimized />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <input type="hidden" name="about_story_image" value={s.about_story_image ?? ''} />
                  <div className="flex flex-col gap-2 justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => openGalleryPicker('about_story_image', 'media')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Pick from Media Library
                    </button>
                    {s.about_story_image && (
                      <button type="button" onClick={() => set('about_story_image', '')} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              </Field>
            </Section>

            {/* Volunteer section photos */}
            <Section icon={<Info />} title="Volunteer Section Photos">
              <p className="text-xs text-slate-500 -mt-1 mb-3">These three photos appear in the image grid next to the &quot;Volunteer With Us&quot; section. Pick from your media gallery or leave a slot empty to show a colour placeholder.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  { key: 'volunteer_photo_1' as const, label: 'Photo 1 (top-left)'    },
                  { key: 'volunteer_photo_2' as const, label: 'Photo 2 (bottom-left)' },
                  { key: 'volunteer_photo_3' as const, label: 'Photo 3 (top-right)'   },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <label className="label text-xs">{label}</label>
                    <div className="w-full h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center relative">
                      {s[key] ? (
                        <Image src={s[key]!} alt={label} fill className="object-cover" unoptimized />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                    <input type="hidden" name={key} value={s[key] ?? ''} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openGalleryPicker(key)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Pick from Gallery
                      </button>
                      {s[key] && (
                        <button type="button" onClick={() => set(key, '')} className="text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── Donate Page ── */}
        {tab === 'Donate Page' && (
          <div className="space-y-4">
            <Section icon={<Info />} title="Hero Section">
              <Field label="Hero Title">
                <input name="donate_hero_title" className="input" value={s.donate_hero_title ?? ''} onChange={(e) => set('donate_hero_title', e.target.value)} placeholder="Your Donation Changes Lives" />
                <p className="text-xs text-slate-400 mt-1">Use &lt;span&gt; tags to highlight a phrase, e.g. Your Donation &lt;span&gt;Changes Lives&lt;/span&gt;.</p>
              </Field>
              <Field label="Hero Subtitle">
                <textarea name="donate_hero_subtitle" rows={3} className="input resize-none" value={s.donate_hero_subtitle ?? ''} onChange={(e) => set('donate_hero_subtitle', e.target.value)} placeholder="Every shilling you give is invested directly into programs that change lives." />
              </Field>
            </Section>
            <Section icon={<Info />} title="Impact Amounts">
              <Field label="Impact Amounts (JSON)">
                <textarea
                  name="donate_impact_amounts"
                  rows={10}
                  className="input resize-none font-mono text-xs"
                  value={s.donate_impact_amounts ?? ''}
                  onChange={(e) => set('donate_impact_amounts', e.target.value)}
                  placeholder={'[\n  { "amount": 500, "impact": "Feeds a family for a week" },\n  { "amount": 1000, "impact": "Buys school supplies for one child" }\n]'}
                />
                <p className="text-xs text-slate-400 mt-1">JSON array of objects with &quot;amount&quot; (number) and &quot;impact&quot; (string). Leave blank to use defaults.</p>
              </Field>
            </Section>
            <SaveBar isPending={isPending} />
          </div>
        )}

        {/* ── FAQ Page ── */}
        {tab === 'FAQ Page' && (
          <div className="space-y-4">
            <Section icon={<Info />} title="Hero Section">
              <p className="text-xs text-slate-500 -mt-1 mb-2">Text shown at the top of the public FAQ page.</p>
              <Field label="Hero Title">
                <input name="faq_hero_title" className="input" value={s.faq_hero_title ?? ''} onChange={(e) => set('faq_hero_title', e.target.value)} placeholder="Frequently Asked Questions" />
              </Field>
              <Field label="Hero Subtitle">
                <textarea name="faq_hero_subtitle" rows={2} className="input resize-none" value={s.faq_hero_subtitle ?? ''} onChange={(e) => set('faq_hero_subtitle', e.target.value)} placeholder="Find answers to common questions about our Foundation…" />
              </Field>
            </Section>
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 text-sm text-primary-800">
              To add, edit or delete FAQ entries, go to <a href="/admin/faq" className="font-semibold underline">Admin → FAQ Management</a>.
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
          <p className="text-sm text-slate-500">These numbers appear on the homepage impact counter section.</p>
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
                        <label className="label text-xs">Unit / Suffix</label>
                        <input className="input text-sm" value={mUnit} onChange={(e) => setMUnit(e.target.value)} placeholder="e.g. +" />
                      </div>
                      <div>
                        <label className="label text-xs">Display Order</label>
                        <input className="input text-sm" type="number" value={mOrder} onChange={(e) => setMOrder(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={isPending} className="btn-primary text-xs flex items-center gap-1.5">
                        <Save className="w-3 h-3" />{isPending ? 'Saving…' : 'Save'}
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

      {/* ── Our Team ── (outside the shared form, has its own save actions) */}
      {tab === 'Our Team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Leadership Team</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditLeaderId(null)
                setLeaderForm({ name: '', role: '', bio: '', image_url: '', sort_order: String(leadershipList.length), is_active: 'true' })
                setShowLeadershipForm(true)
              }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>
          <p className="text-sm text-slate-500">These team members appear on the public About page under &quot;Our Leadership&quot;.</p>

          {showLeadershipForm && (
            <div className="card p-5 border-2 border-primary-200 bg-primary-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">{editLeaderId ? 'Edit Member' : 'New Team Member'}</h3>
                <button type="button" onClick={() => setShowLeadershipForm(false)} className="p-1 rounded hover:bg-gray-200 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Name *</label>
                  <input className="input text-sm" value={leaderForm.name} onChange={(e) => setLeaderForm((p) => ({ ...p, name: e.target.value }))} placeholder="Dr. Jane Doe" />
                </div>
                <div>
                  <label className="label text-xs">Role / Title *</label>
                  <input className="input text-sm" value={leaderForm.role} onChange={(e) => setLeaderForm((p) => ({ ...p, role: e.target.value }))} placeholder="Executive Director" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-xs">Bio</label>
                  <textarea className="input text-sm resize-none" rows={2} value={leaderForm.bio} onChange={(e) => setLeaderForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Short biography..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-xs">Photo URL</label>
                  <input className="input text-sm" value={leaderForm.image_url} onChange={(e) => setLeaderForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className="label text-xs">Display Order</label>
                  <input type="number" className="input text-sm" value={leaderForm.sort_order} onChange={(e) => setLeaderForm((p) => ({ ...p, sort_order: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="leader_active" checked={leaderForm.is_active === 'true'} onChange={(e) => setLeaderForm((p) => ({ ...p, is_active: e.target.checked ? 'true' : 'false' }))} className="w-4 h-4 accent-primary-600" />
                  <label htmlFor="leader_active" className="text-sm text-slate-700">Visible on public page</label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={leaderSaving || !leaderForm.name || !leaderForm.role}
                  onClick={async () => {
                    setLeaderSaving(true)
                    const fd = new FormData()
                    Object.entries(leaderForm).forEach(([k, v]) => fd.append(k, v))
                    const result = await saveLeadershipMember(fd, editLeaderId ?? undefined)
                    setLeaderSaving(false)
                    if (result?.error) {
                      showToast({ type: 'error', msg: result.error as string })
                    } else {
                      showToast({ type: 'success', msg: editLeaderId ? 'Team member updated.' : 'Team member added.' })
                      setShowLeadershipForm(false)
                      // Optimistic update — refetch would need router.refresh(); for now, reload
                      if (!editLeaderId) {
                        setLeadershipList((prev) => [...prev, {
                          id: Date.now().toString(),
                          name: leaderForm.name,
                          role: leaderForm.role,
                          bio: leaderForm.bio || null,
                          image_url: leaderForm.image_url || null,
                          sort_order: parseInt(leaderForm.sort_order) || 0,
                          is_active: leaderForm.is_active === 'true',
                        }])
                      } else {
                        setLeadershipList((prev) => prev.map((m) => m.id === editLeaderId ? {
                          ...m,
                          name: leaderForm.name,
                          role: leaderForm.role,
                          bio: leaderForm.bio || null,
                          image_url: leaderForm.image_url || null,
                          sort_order: parseInt(leaderForm.sort_order) || 0,
                          is_active: leaderForm.is_active === 'true',
                        } : m))
                      }
                    }
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {leaderSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {leaderSaving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowLeadershipForm(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leadershipList.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full">No team members yet. Click &quot;Add Member&quot; to get started.</p>
            )}
            {leadershipList.map((member) => (
              <div key={member.id} className="card p-4 flex gap-3 items-start">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary-100 flex-shrink-0">
                  {member.image_url ? (
                    <Image src={member.image_url} alt={member.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-sm">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{member.name}</div>
                  <div className="text-xs text-primary-600 truncate">{member.role}</div>
                  {!member.is_active && <span className="text-xs text-slate-400">(hidden)</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditLeaderId(member.id)
                      setLeaderForm({
                        name: member.name,
                        role: member.role,
                        bio: member.bio ?? '',
                        image_url: member.image_url ?? '',
                        sort_order: String(member.sort_order),
                        is_active: member.is_active ? 'true' : 'false',
                      })
                      setShowLeadershipForm(true)
                    }}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {leaderDeleteId === member.id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await deleteLeadershipMember(member.id)
                        if (result?.error) showToast({ type: 'error', msg: result.error as string })
                        else {
                          setLeadershipList((prev) => prev.filter((m) => m.id !== member.id))
                          showToast({ type: 'success', msg: 'Member removed.' })
                        }
                        setLeaderDeleteId(null)
                      }}
                      className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="Confirm delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLeaderDeleteId(member.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Awareness Days manager (outside shared form) ── */}
      {tab === 'Awareness Calendar' && (
        <div className="space-y-4 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Awareness Days</h2>
              <span className="text-xs text-slate-400">({awarenessList.length} total)</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="input text-xs py-1.5 h-8"
                value={awarenessFilter}
                onChange={(e) => setAwarenessFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                <option value="kenyan_national">🇰🇪 Kenyan National</option>
                <option value="international">🌐 International</option>
                <option value="ngo_environmental">🌿 Environmental</option>
                <option value="community_volunteer">🤝 Community</option>
                <option value="education_youth">📚 Education & Youth</option>
                <option value="foundation">🏛️ Foundation</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setEditAwarenessId(null)
                  setAwarenessForm(blankAwareness)
                  setShowAwarenessForm(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="btn-primary text-xs flex items-center gap-1.5 h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" /> Add Day
              </button>
            </div>
          </div>

          {/* Add / Edit Form */}
          {showAwarenessForm && (
            <div className="card p-5 border-2 border-primary-200 bg-primary-50/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">{editAwarenessId ? 'Edit Awareness Day' : 'New Awareness Day'}</h3>
                <button type="button" onClick={() => setShowAwarenessForm(false)} className="p-1 rounded hover:bg-gray-200 text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="label text-xs">Name *</label>
                  <input className="input text-sm" value={awarenessForm.name} onChange={(e) => setAwarenessForm((p) => ({ ...p, name: e.target.value }))} placeholder="World Environment Day" />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="label text-xs">Description</label>
                  <textarea rows={2} className="input text-sm resize-none" value={awarenessForm.description} onChange={(e) => setAwarenessForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description…" />
                </div>

                {/* Category */}
                <div>
                  <label className="label text-xs">Category</label>
                  <select className="input text-sm" value={awarenessForm.category} onChange={(e) => setAwarenessForm((p) => ({ ...p, category: e.target.value }))}>
                    <option value="kenyan_national">🇰🇪 Kenyan National</option>
                    <option value="international">🌐 International</option>
                    <option value="ngo_environmental">🌿 Environmental / NGO</option>
                    <option value="community_volunteer">🤝 Community / Volunteer</option>
                    <option value="education_youth">📚 Education & Youth</option>
                    <option value="foundation">🏛️ Foundation</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="label text-xs">Priority</label>
                  <select className="input text-sm" value={awarenessForm.priority} onChange={(e) => setAwarenessForm((p) => ({ ...p, priority: e.target.value }))}>
                    <option value="high">High — always shown</option>
                    <option value="medium">Medium — shown by default</option>
                    <option value="low">Low — shown only if min priority is low</option>
                  </select>
                </div>

                {/* Date type toggle */}
                <div className="sm:col-span-2">
                  <label className="label text-xs">Date Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAwarenessForm((p) => ({ ...p, date_type: 'annual' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${awarenessForm.date_type === 'annual' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}
                    >
                      Annual (e.g. every June 5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwarenessForm((p) => ({ ...p, date_type: 'once' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${awarenessForm.date_type === 'once' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}
                    >
                      One-time date
                    </button>
                  </div>
                </div>

                {awarenessForm.date_type === 'annual' ? (
                  <>
                    <div>
                      <label className="label text-xs">Month (1–12)</label>
                      <input type="number" min={1} max={12} className="input text-sm" value={awarenessForm.month} onChange={(e) => setAwarenessForm((p) => ({ ...p, month: e.target.value }))} placeholder="6" />
                    </div>
                    <div>
                      <label className="label text-xs">Day (1–31)</label>
                      <input type="number" min={1} max={31} className="input text-sm" value={awarenessForm.day} onChange={(e) => setAwarenessForm((p) => ({ ...p, day: e.target.value }))} placeholder="5" />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="label text-xs">Specific Date</label>
                    <input type="date" className="input text-sm" value={awarenessForm.specific_date} onChange={(e) => setAwarenessForm((p) => ({ ...p, specific_date: e.target.value }))} />
                  </div>
                )}

                {/* Icon emoji */}
                <div>
                  <label className="label text-xs">Icon Emoji</label>
                  <input className="input text-sm" value={awarenessForm.icon_emoji} onChange={(e) => setAwarenessForm((p) => ({ ...p, icon_emoji: e.target.value }))} placeholder="🌍" maxLength={4} />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="awareness_active" checked={awarenessForm.is_active === 'true'} onChange={(e) => setAwarenessForm((p) => ({ ...p, is_active: e.target.checked ? 'true' : 'false' }))} className="w-4 h-4 accent-primary-600" />
                  <label htmlFor="awareness_active" className="text-sm text-slate-700">Active (visible)</label>
                </div>

                {/* Banner message */}
                <div className="sm:col-span-2">
                  <label className="label text-xs">Banner Message</label>
                  <input className="input text-sm" value={awarenessForm.banner_message} onChange={(e) => setAwarenessForm((p) => ({ ...p, banner_message: e.target.value }))} placeholder="Happy World Environment Day! Every action counts…" />
                </div>

                {/* CTA link */}
                <div>
                  <label className="label text-xs">CTA Link URL</label>
                  <input className="input text-sm" value={awarenessForm.link_url} onChange={(e) => setAwarenessForm((p) => ({ ...p, link_url: e.target.value }))} placeholder="/programs" />
                </div>
                <div>
                  <label className="label text-xs">CTA Link Label</label>
                  <input className="input text-sm" value={awarenessForm.link_label} onChange={(e) => setAwarenessForm((p) => ({ ...p, link_label: e.target.value }))} placeholder="Learn More" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={awarenessSaving || !awarenessForm.name}
                  onClick={async () => {
                    setAwarenessSaving(true)
                    const fd = new FormData()
                    Object.entries(awarenessForm).forEach(([k, v]) => fd.append(k, v))
                    const result = await saveAwarenessDay(fd, editAwarenessId ?? undefined)
                    setAwarenessSaving(false)
                    if (result?.error) {
                      showToast({ type: 'error', msg: result.error as string })
                    } else {
                      showToast({ type: 'success', msg: editAwarenessId ? 'Awareness day updated.' : 'Awareness day added.' })
                      setShowAwarenessForm(false)
                      const updated: AwarenessDay = {
                        id: editAwarenessId ?? Date.now().toString(),
                        name: awarenessForm.name,
                        description: awarenessForm.description || null,
                        month: awarenessForm.date_type === 'annual' ? (parseInt(awarenessForm.month) || null) : null,
                        day: awarenessForm.date_type === 'annual' ? (parseInt(awarenessForm.day) || null) : null,
                        specific_date: awarenessForm.date_type === 'once' ? awarenessForm.specific_date || null : null,
                        category: awarenessForm.category,
                        priority: awarenessForm.priority,
                        icon_emoji: awarenessForm.icon_emoji || null,
                        banner_message: awarenessForm.banner_message || null,
                        link_url: awarenessForm.link_url || null,
                        link_label: awarenessForm.link_label || null,
                        is_active: awarenessForm.is_active === 'true',
                      }
                      setAwarenessList((prev) => editAwarenessId ? prev.map((d) => d.id === editAwarenessId ? updated : d) : [...prev, updated])
                    }
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {awarenessSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {awarenessSaving ? 'Saving…' : 'Save Day'}
                </button>
                <button type="button" onClick={() => setShowAwarenessForm(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="card overflow-hidden">
            {awarenessList.filter((d) => awarenessFilter === 'all' || d.category === awarenessFilter).length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">
                {awarenessFilter === 'all' ? 'No awareness days yet. Click "Add Day" to get started.' : 'No days in this category.'}
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {awarenessList
                  .filter((d) => awarenessFilter === 'all' || d.category === awarenessFilter)
                  .map((d) => {
                    const dateStr = d.specific_date
                      ? d.specific_date
                      : d.month && d.day
                      ? `${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')} annually`
                      : '—'
                    return (
                      <div key={d.id} className={`flex items-center gap-3 px-4 py-3 ${!d.is_active ? 'opacity-50' : ''}`}>
                        <div className="text-xl w-8 text-center flex-shrink-0">{d.icon_emoji ?? '📅'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 truncate">{d.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${d.priority === 'high' ? 'bg-rose-100 text-rose-700' : d.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {d.priority}
                            </span>
                            {!d.is_active && <span className="text-xs text-slate-400">(inactive)</span>}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{dateStr}</span>
                            <span>·</span>
                            <span>{d.category.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditAwarenessId(d.id)
                              setAwarenessForm({
                                name: d.name,
                                description: d.description ?? '',
                                date_type: d.specific_date ? 'once' : 'annual',
                                month: d.month ? String(d.month) : '',
                                day: d.day ? String(d.day) : '',
                                specific_date: d.specific_date ?? '',
                                category: d.category,
                                priority: d.priority,
                                icon_emoji: d.icon_emoji ?? '📅',
                                banner_message: d.banner_message ?? '',
                                link_url: d.link_url ?? '',
                                link_label: d.link_label ?? '',
                                is_active: d.is_active ? 'true' : 'false',
                              })
                              setShowAwarenessForm(true)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {awarenessDeleteId === d.id ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await deleteAwarenessDay(d.id)
                                if (result?.error) showToast({ type: 'error', msg: result.error as string })
                                else {
                                  setAwarenessList((prev) => prev.filter((x) => x.id !== d.id))
                                  showToast({ type: 'success', msg: 'Awareness day deleted.' })
                                }
                                setAwarenessDeleteId(null)
                              }}
                              className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              title="Confirm delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAwarenessDeleteId(d.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Partners & Sponsors management (outside shared form) ── */}
      {tab === 'Partners & Sponsors' && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Partner Logos</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditPartnerId(null)
                setPartnerForm({ name: '', logo_url: '', website_url: '', sort_order: String(partnerList.length), is_active: 'true' })
                setShowPartnerForm(true)
              }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Partner
            </button>
          </div>
          <p className="text-sm text-slate-500">Add partners whose logos will be displayed on the homepage strip.</p>

          {showPartnerForm && (
            <div className="card p-5 border-2 border-primary-200 bg-primary-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">{editPartnerId ? 'Edit Partner' : 'New Partner'}</h3>
                <button type="button" onClick={() => setShowPartnerForm(false)} className="p-1 rounded hover:bg-gray-200 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Organisation Name *</label>
                  <input className="input text-sm" value={partnerForm.name} onChange={(e) => setPartnerForm((p) => ({ ...p, name: e.target.value }))} placeholder="ACME Corp" />
                </div>
                <div>
                  <label className="label text-xs">Website URL</label>
                  <input className="input text-sm" type="url" value={partnerForm.website_url} onChange={(e) => setPartnerForm((p) => ({ ...p, website_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-xs">Logo URL</label>
                  <input className="input text-sm" value={partnerForm.logo_url} onChange={(e) => setPartnerForm((p) => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className="label text-xs">Display Order</label>
                  <input type="number" className="input text-sm" value={partnerForm.sort_order} onChange={(e) => setPartnerForm((p) => ({ ...p, sort_order: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="partner_active" checked={partnerForm.is_active === 'true'} onChange={(e) => setPartnerForm((p) => ({ ...p, is_active: e.target.checked ? 'true' : 'false' }))} className="w-4 h-4 accent-primary-600" />
                  <label htmlFor="partner_active" className="text-sm text-slate-700">Visible on homepage</label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={partnerSaving || !partnerForm.name}
                  onClick={async () => {
                    setPartnerSaving(true)
                    const fd = new FormData()
                    Object.entries(partnerForm).forEach(([k, v]) => fd.append(k, v))
                    const result = await savePartner(fd, editPartnerId ?? undefined)
                    setPartnerSaving(false)
                    if (result?.error) {
                      showToast({ type: 'error', msg: result.error as string })
                    } else {
                      showToast({ type: 'success', msg: editPartnerId ? 'Partner updated.' : 'Partner added.' })
                      setShowPartnerForm(false)
                      const newPartner: Partner = {
                        id: editPartnerId ?? Date.now().toString(),
                        name: partnerForm.name,
                        logo_url: partnerForm.logo_url || null,
                        website_url: partnerForm.website_url || null,
                        sort_order: parseInt(partnerForm.sort_order) || 0,
                        is_active: partnerForm.is_active === 'true',
                      }
                      if (!editPartnerId) {
                        setPartnerList((prev) => [...prev, newPartner])
                      } else {
                        setPartnerList((prev) => prev.map((p) => p.id === editPartnerId ? newPartner : p))
                      }
                    }
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {partnerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {partnerSaving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowPartnerForm(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerList.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full">No partners yet. Click &quot;Add Partner&quot; to get started.</p>
            )}
            {partnerList.map((partner) => (
              <div key={partner.id} className="card p-4 flex gap-3 items-center">
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  {partner.logo_url ? (
                    <Image src={partner.logo_url} alt={partner.name} width={56} height={40} className="w-full h-full object-contain" unoptimized />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{partner.name}</div>
                  {partner.website_url && <div className="text-xs text-primary-600 truncate">{partner.website_url}</div>}
                  {!partner.is_active && <span className="text-xs text-slate-400">(hidden)</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPartnerId(partner.id)
                      setPartnerForm({
                        name: partner.name,
                        logo_url: partner.logo_url ?? '',
                        website_url: partner.website_url ?? '',
                        sort_order: String(partner.sort_order),
                        is_active: partner.is_active ? 'true' : 'false',
                      })
                      setShowPartnerForm(true)
                    }}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {partnerDeleteId === partner.id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await deletePartner(partner.id)
                        if (result?.error) showToast({ type: 'error', msg: result.error as string })
                        else {
                          setPartnerList((prev) => prev.filter((p) => p.id !== partner.id))
                          showToast({ type: 'success', msg: 'Partner removed.' })
                        }
                        setPartnerDeleteId(null)
                      }}
                      className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="Confirm delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPartnerDeleteId(partner.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-primary-600 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

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
      <label className="label flex items-center gap-1.5 text-xs">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  )
}

function ToggleField({
  label,
  description,
  value,
  onToggle,
  name,
}: {
  label: string
  description: string
  value: boolean
  onToggle: () => void
  name: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          value ? 'bg-primary-600' : 'bg-slate-300'
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
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
