'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Camera, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

export default function ProfilePage() {
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email: string; user_metadata: Record<string, string> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    bio: '',
    location: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user as typeof user & { email: string; user_metadata: Record<string, string> })
        setForm({
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          bio: user.user_metadata?.bio || '',
          location: user.user_metadata?.location || '',
        })
      }
      setLoading(false)
    })
  }, [supabase.auth])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase.auth.updateUser({
      data: form,
    })

    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const initials = form.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Update your personal information and membership details.</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
            {initials}
          </div>
          <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 transition-colors">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <div className="font-bold text-slate-900">{form.full_name || 'Your Name'}</div>
          <div className="text-sm text-slate-500">{user?.email}</div>
          <span className="badge-green mt-1 inline-block text-xs">Basic Member</span>
        </div>
      </div>

      {/* Membership info */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-900 mb-4">Membership Status</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Membership Tier', value: 'Basic' },
            { label: 'Member Since', value: 'April 2026' },
            { label: 'Status', value: 'Active' },
            { label: 'Role', value: 'Member' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-sm text-slate-700 font-medium">Want more access?</p>
          <p className="text-xs text-slate-500 mt-0.5">Upgrade to Active Member for exclusive event access and program benefits.</p>
          <button className="btn-primary text-xs mt-3">Upgrade Membership</button>
        </div>
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
              value={user?.email || ''}
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

