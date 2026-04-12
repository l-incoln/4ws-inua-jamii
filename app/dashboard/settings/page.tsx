'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Lock, Shield, Trash2, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import type { Metadata } from 'next'

export default function DashboardSettingsPage() {
  const supabase = createClient()

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Notification prefs (local only — extend with DB column if needed)
  const [notifPrefs, setNotifPrefs] = useState({
    event_reminders: true,
    announcements: true,
    donation_receipts: true,
    newsletter: false,
  })
  const [notifSaved, setNotifSaved] = useState(false)

  // Account info
  const [email, setEmail] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '')
    })
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (pwForm.newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPwLoading(true)
    setPwMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwLoading(false)
    if (error) {
      setPwMsg({ type: 'error', text: error.message })
    } else {
      setPwMsg({ type: 'success', text: 'Password updated successfully.' })
      setPwForm({ current: '', newPw: '', confirm: '' })
    }
  }

  function saveNotifPrefs() {
    // In a real implementation, persist to a profiles column or separate table
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2500)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account security and preferences.</p>
      </div>

      {/* Account info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Account Info</h2>
            <p className="text-xs text-slate-500">Your login credentials</p>
          </div>
        </div>
        <div>
          <label className="label">Email Address</label>
          <input className="input" type="email" value={email} disabled />
          <p className="text-xs text-slate-400 mt-1.5">To change your email address, contact support.</p>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Update your account password</p>
          </div>
        </div>

        {pwMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${
            pwMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {pwMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Repeat new password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={pwLoading}>
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Notification Preferences</h2>
            <p className="text-xs text-slate-500">Control what emails you receive</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {([
            { key: 'event_reminders', label: 'Event Reminders', desc: 'Get reminded before events you RSVPed for' },
            { key: 'announcements', label: 'Announcements', desc: 'Important updates from the foundation' },
            { key: 'donation_receipts', label: 'Donation Receipts', desc: 'Email receipt for every donation' },
            { key: 'newsletter', label: 'Newsletter', desc: 'Monthly impact newsletter' },
          ] as const).map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary-600"
                  checked={notifPrefs[key]}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            </label>
          ))}
        </div>

        <button onClick={saveNotifPrefs} className="btn-primary text-sm">
          {notifSaved ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {notifSaved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Danger Zone</h2>
            <p className="text-xs text-slate-500">Irreversible account actions</p>
          </div>
        </div>

        {!deleteConfirm ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
            <div>
              <div className="text-sm font-semibold text-red-800">Delete Account</div>
              <div className="text-xs text-red-600 mt-0.5">This will permanently remove your data. Cannot be undone.</div>
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-100 border border-red-200">
            <div className="text-sm font-semibold text-red-900">Are you sure? This cannot be undone.</div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Contact support to delete — Supabase admin API needed server-side
                  alert('Please contact support at info@4wsinuajamii.org to delete your account.')
                  setDeleteConfirm(false)
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
