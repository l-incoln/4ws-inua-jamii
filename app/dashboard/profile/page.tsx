'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, CheckCircle2, Camera, Upload } from 'lucide-react'
import { compressImage } from '@/lib/compress-image'
import BackLink from '@/components/dashboard/BackLink'

const tierLabels: Record<string, string> = {
  basic: 'Classic Member',
  active: 'Premium Member',
  champion: 'Gold Member',
}

const tierBadgeColors: Record<string, string> = {
  basic:    'badge-gray',
  active:   'badge-green',
  champion: 'bg-yellow-100 text-yellow-800 badge',
}

const statusLabels: Record<string, string> = {
  approved: 'Approved',
  pending:  'Pending',
  rejected: 'Rejected',
}

const statusColors: Record<string, string> = {
  approved: 'badge-green',
  pending:  'badge-sky',
  rejected: 'badge-red',
}

export default function ProfilePage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<{
    tier: string
    membership_status: string
    role: string
    created_at: string
  } | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    bio: '',
    location: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setEmail(user.email ?? '')
      setUserId(user.id)

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, phone, bio, location, tier, membership_status, role, created_at, avatar_url')
        .eq('id', user.id)
        .single()

      if (p) {
        setProfile({ tier: p.tier, membership_status: p.membership_status, role: p.role, created_at: p.created_at })
        setAvatarUrl(p.avatar_url ?? null)
        setForm({
          full_name: p.full_name || '',
          phone: p.phone || '',
          bio: p.bio || '',
          location: p.location || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarLoading(true)
    setAvatarError(null)
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85, outputType: 'image/webp' })
      const ext = 'webp'
      const storagePath = `avatars/${userId}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('uploads')
        .upload(storagePath, compressed, { upsert: true, contentType: 'image/webp' })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storagePath)
      const cacheBusted = `${publicUrl}?t=${Date.now()}`
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
      if (dbErr) throw dbErr
      // Keep auth metadata in sync
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      setAvatarUrl(cacheBusted)
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setAvatarLoading(false)
      // Reset input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); setError('Not authenticated.'); return }

    // Update profiles table
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name, phone: form.phone, bio: form.bio, location: form.location })
      .eq('id', user.id)

    if (dbErr) {
      setSaving(false)
      setError(dbErr.message)
      return
    }

    // Keep auth metadata in sync too
    await supabase.auth.updateUser({ data: { full_name: form.full_name, phone: form.phone } })

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const initials = form.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??'

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Update your personal information and membership details.</p>
      </div>

      {/* Avatar */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          {/* Avatar image / initials with upload button */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              title="Change profile photo"
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
            >
              {avatarLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 truncate">{form.full_name || 'Your Name'}</div>
            <div className="text-sm text-slate-500 truncate">{email}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`${tierBadgeColors[profile?.tier ?? 'basic'] ?? 'badge-gray'} text-xs`}>
                {tierLabels[profile?.tier ?? 'basic'] ?? 'Member'}
              </span>
              <span className={`${statusColors[profile?.membership_status ?? 'pending'] ?? 'badge-gray'} text-xs`}>
                {statusLabels[profile?.membership_status ?? 'pending'] ?? 'Pending'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors"
            >
              <Upload className="w-3 h-3" />
              {avatarLoading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
            {avatarError && (
              <p className="text-xs text-red-600 mt-1">{avatarError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Membership info */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-4">Membership Status</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Membership Tier', value: tierLabels[profile?.tier ?? 'basic'] ?? 'Basic' },
            { label: 'Member Since', value: memberSince },
            { label: 'Status', value: profile?.membership_status ?? 'pending' },
            { label: 'Role', value: profile?.role ?? 'member' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{value}</div>
            </div>
          ))}
        </div>
        {profile?.membership_status === 'pending' && (
          <div className="mt-5 p-4 bg-sky-50 rounded-xl border border-sky-100">
            <p className="text-sm text-sky-800 font-medium">Application Under Review</p>
            <p className="text-xs text-sky-600 mt-0.5">Your membership application is being reviewed. You&apos;ll be notified once approved.</p>
          </div>
        )}
        {profile?.tier === 'basic' && profile?.membership_status === 'approved' && (
          <div className="mt-5 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm text-slate-700 font-medium">Want more access?</p>
            <p className="text-xs text-slate-500 mt-0.5">Upgrade to Active Member for exclusive event access and program benefits.</p>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-5">Personal Information</h2>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+254 700 000 000"
              />
            </div>
          </div>

          <div>
            <label className="label">Location</label>
            <input
              type="text"
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Nairobi, Kenya"
            />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              className="input resize-none h-24"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input bg-gray-50 cursor-not-allowed"
              value={email}
              disabled
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed here. Contact support.</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

