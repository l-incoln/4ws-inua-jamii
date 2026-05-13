'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, Lock, Shield, Trash2, Loader2, CheckCircle2, Eye, EyeOff, QrCode, ChevronRight, AlertTriangle } from 'lucide-react'

const DEFAULT_PREFS = {
  event_reminders: true,
  announcements: true,
  donation_receipts: true,
  newsletter: false,
}

// ─── Delete Account confirmation widget ────────────────────────────────────────
function DeleteAccountConfirm({ onCancel }: { onCancel: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setError(null)
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); setDeleting(false); return }

      // 2. Call the delete-account API route (server-side uses admin client)
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to delete account. Please contact support.')
        setDeleting(false)
        return
      }

      // 3. Sign out and redirect home
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch {
      setError('An unexpected error occurred. Please try again or contact support.')
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-900">This is permanent and cannot be undone.</p>
          <ul className="mt-2 text-xs text-red-700 space-y-1 list-disc list-inside">
            <li>Your profile and all personal data will be deleted</li>
            <li>Your donation history and event RSVPs will be removed</li>
            <li>You will lose access to the member portal immediately</li>
            <li>This action complies with the Data Protection Act 2019</li>
          </ul>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-700 bg-red-100 rounded-lg p-2">{error}</p>
      )}
      <div>
        <label className="text-xs font-semibold text-red-800 block mb-1.5">
          Type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> to confirm
        </label>
        <input
          className="input border-red-300 focus:ring-red-400 text-sm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          placeholder="DELETE"
          autoComplete="off"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-gray-100 border border-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || deleting}
          className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
          {deleting ? 'Deleting…' : 'Delete My Account'}
        </button>
      </div>
    </div>
  )
}

export default function DashboardSettingsPage() {
  const supabase = createClient()

  // Password change
  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Notification prefs — persisted to Supabase user metadata
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_PREFS)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  // Account info
  const [email, setEmail] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null)
  const [hasActiveTerm, setHasActiveTerm] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      // Load saved prefs from user metadata
      const saved = user.user_metadata?.notification_prefs
      if (saved && typeof saved === 'object') {
        setNotifPrefs({ ...DEFAULT_PREFS, ...saved })
      }
      // Fetch membership status
      const { data: profile } = await supabase
        .from('profiles')
        .select('membership_status')
        .eq('id', user.id)
        .single()
      if (profile) setMembershipStatus(profile.membership_status)
      // Check for active term
      const { data: terms } = await supabase
        .from('membership_terms')
        .select('id, valid_until, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .limit(1)
      setHasActiveTerm(!!(terms && terms.length > 0))
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
      setPwForm({ newPw: '', confirm: '' })
    }
  }

  async function saveNotifPrefs() {
    setNotifLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { notification_prefs: notifPrefs },
    })
    setNotifLoading(false)
    if (!error) {
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2500)
    }
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

        <button onClick={saveNotifPrefs} disabled={notifLoading} className="btn-primary text-sm">
          {notifLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : notifSaved ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {notifLoading ? 'Saving…' : notifSaved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>

      {/* Verification & Privacy */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">QR Verification & Privacy</h2>
            <p className="text-xs text-slate-500">Manage your membership verification settings</p>
          </div>
        </div>

        <div className="space-y-0">
          {/* QR status */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">QR Code Status</p>
              <p className="text-xs text-slate-500 mt-0.5">Your cryptographically signed membership QR</p>
            </div>
            {hasActiveTerm ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {membershipStatus === 'approved' ? 'No active term' : 'Pending approval'}
              </span>
            )}
          </div>

          {/* Link to membership card */}
          <Link
            href="/dashboard/membership-card"
            className="flex items-center justify-between py-3 border-b border-slate-100 group hover:bg-slate-50 -mx-6 px-6 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">View Membership Card</p>
              <p className="text-xs text-slate-500 mt-0.5">Download, print, or enlarge your QR code</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
          </Link>

          {/* What QR exposes */}
          <div className="py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data exposed when scanned</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Full name', 'Membership tier', 'Valid from / until', 'Member role'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              <strong className="text-slate-500">Signed with HMAC-SHA256.</strong>{' '}
              The verification link is cryptographically signed — any tampering with the token is automatically detected and rejected during verification.
              Your email and phone number are never included.
            </p>
          </div>
        </div>
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
              <div className="text-xs text-red-600 mt-0.5">
                Permanently removes all your data. This action cannot be undone.
              </div>
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <DeleteAccountConfirm onCancel={() => setDeleteConfirm(false)} />
        )}
      </div>
    </div>
  )
}
