'use client'

import { useEffect, useState } from 'react'
import { Cake, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { getMyBirthdaySettings, saveMyBirthday, deleteMyBirthday } from '@/app/actions/birthday'
import { todayInZone } from '@/lib/birthdays'

export default function BirthdaySettingsCard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasStored, setHasStored] = useState(false)

  const [birthDate, setBirthDate] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [receiveGreetings, setReceiveGreetings] = useState(true)

  useEffect(() => {
    getMyBirthdaySettings().then((res) => {
      if ('error' in res) {
        setError(res.error)
      } else {
        setBirthDate(res.birth_date ?? '')
        setIsPublic(res.is_public)
        setReceiveGreetings(res.receive_greetings)
        setHasStored(!!res.birth_date)
      }
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await saveMyBirthday({ birthDate, isPublic, receiveGreetings })
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setHasStored(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDelete() {
    setSaving(true)
    setError(null)
    const res = await deleteMyBirthday()
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setBirthDate('')
    setIsPublic(false)
    setReceiveGreetings(true)
    setHasStored(false)
  }

  // Same zone the server validates and matches in, so the boundary day is selectable
  const today = todayInZone()

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center">
          <Cake className="w-4 h-4 text-pink-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Birthday & Celebrations</h2>
          <p className="text-xs text-slate-500">You choose who gets to celebrate with you</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label" htmlFor="birth-date">Date of Birth</label>
            <input
              id="birth-date"
              type="date"
              className="input"
              value={birthDate}
              max={today}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Only you and the membership team can see this. Other members never see your birth year.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded accent-primary-600"
                checked={receiveGreetings}
                onChange={(e) => setReceiveGreetings(e.target.checked)}
              />
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                  Celebrate me on my dashboard
                </div>
                <div className="text-xs text-slate-500">
                  A personal birthday message on your dashboard and by email on the day.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded accent-primary-600"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                  Let the wider 4W&rsquo;S community celebrate me
                </div>
                <div className="text-xs text-slate-500">
                  Shares your name and the day &amp; month (never the year) with other members on the day.
                  Leave this off to keep your birthday private to the membership team.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary text-sm" disabled={saving || !birthDate}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Cake className="w-4 h-4" />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Birthday'}
            </button>
            {hasStored && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove my birthday
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
