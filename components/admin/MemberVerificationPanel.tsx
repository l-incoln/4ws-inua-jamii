'use client'

import { useState, useTransition } from 'react'
import { Search, CheckCircle, XCircle, Shield, Star, Award, Clock, Loader2, CreditCard, RefreshCw, Plus } from 'lucide-react'
import { isExpired, formatMembershipId } from '@/lib/membership'
import { awardBadge } from '@/app/actions/achievements'
import { issueMembership, renewMembership } from '@/app/actions/admin'
import { BADGE_META } from '@/lib/badge-meta'
import type { BadgeType, MembershipTier } from '@/types'

interface VerifyResult {
  id: string
  name: string | null
  tier: string
  status: string
  avatar: string | null
  termId: string | null
  validUntil: string | null
  role: string
  badges: string[]
}

interface Props {
  // Pass members server-side so we can do client-side filtering without extra fetch
  members: {
    id: string
    full_name: string | null
    tier: string
    membership_status: string
    avatar_url: string | null
    role: string
    terms: { id: string; valid_until: string; is_active: boolean }[]
    badges: string[]
  }[]
}

const TIER_ICONS: Record<string, React.ElementType> = {
  basic: Shield, active: Star, champion: Award,
}

export default function MemberVerificationPanel({ members }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<VerifyResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [badgeMsg, setBadgeMsg] = useState('')
  const [membershipMsg, setMembershipMsg] = useState('')
  const [issueForm, setIssueForm] = useState<{ tier: MembershipTier; months: string } | null>(null)

  const filtered = query.trim().length < 2 ? [] : members.filter((m) => {
    const q = query.toLowerCase()
    const name = (m.full_name ?? '').toLowerCase()
    const id = formatMembershipId(m.id).toLowerCase()
    return name.includes(q) || id.includes(q)
  }).slice(0, 8)

  function selectMember(m: Props['members'][0]) {
    const activeTerm = m.terms.find((t) => t.is_active) ?? null
    setSelected({
      id: m.id,
      name: m.full_name,
      tier: m.tier,
      status: m.membership_status,
      avatar: m.avatar_url,
      termId: activeTerm?.id ?? null,
      validUntil: activeTerm?.valid_until ?? null,
      role: m.role,
      badges: m.badges,
    })
    setQuery(m.full_name ?? '')
    setBadgeMsg('')
    setMembershipMsg('')
    setIssueForm(null)
  }

  function handleAwardBadge(type: BadgeType) {
    if (!selected) return
    setBadgeMsg('')
    startTransition(async () => {
      const res = await awardBadge(selected.id, type)
      if (res?.error) { setBadgeMsg(`Error: ${res.error}`); return }
      setBadgeMsg(`✅ Badge "${BADGE_META[type]?.label}" awarded!`)
      setSelected((s) => s ? { ...s, badges: [...s.badges, type] } : s)
    })
  }

  function handleIssueMembership(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !issueForm) return
    const months = parseInt(issueForm.months)
    if (isNaN(months) || months < 1) return
    setMembershipMsg('')
    startTransition(async () => {
      const res = await issueMembership(selected.id, issueForm.tier, months)
      if (res?.error) { setMembershipMsg(`Error: ${res.error}`); return }
      setMembershipMsg('✅ Membership issued successfully!')
      setIssueForm(null)
      const newUntil = new Date()
      newUntil.setMonth(newUntil.getMonth() + months)
      setSelected((s) => s ? { ...s, status: 'approved', tier: issueForm.tier, validUntil: newUntil.toISOString().split('T')[0] } : s)
    })
  }

  function handleRenew() {
    if (!selected?.termId) return
    const months = 12
    setMembershipMsg('')
    startTransition(async () => {
      const res = await renewMembership(selected.termId!, months)
      if (res?.error) { setMembershipMsg(`Error: ${res.error}`); return }
      setMembershipMsg('✅ Membership renewed for 12 months!')
      const newUntil = new Date(selected.validUntil ?? Date.now())
      newUntil.setMonth(newUntil.getMonth() + months)
      setSelected((s) => s ? { ...s, validUntil: newUntil.toISOString().split('T')[0] } : s)
    })
  }

  const TierIcon = TIER_ICONS[selected?.tier ?? 'basic'] ?? Shield
  const exp = selected?.validUntil ? isExpired(selected.validUntil) : true
  const isValid = selected ? !exp && selected.status === 'approved' : false

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary-600" />
        <h2 className="font-semibold text-slate-900">Quick Member Verification</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
          placeholder="Search by name or Member ID…"
          className="input pl-10 w-full"
          autoComplete="off"
        />
      </div>

      {/* Dropdown results */}
      {filtered.length > 0 && !selected && (
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 -mt-1">
          {filtered.map((m) => {
            const activeTerm = m.terms.find((t) => t.is_active)
            const exp = activeTerm ? isExpired(activeTerm.valid_until) : true
            return (
              <button
                key={m.id}
                onClick={() => selectMember(m)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.full_name}</p>
                  <p className="text-xs text-slate-400 font-mono">{formatMembershipId(m.id)}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.membership_status === 'approved' && !exp
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {m.membership_status === 'approved' && !exp ? 'Active' : 'Inactive'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Verification Result */}
      {selected && (
        <div className={`rounded-2xl border-2 overflow-hidden ${
          isValid ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'
        }`}>
          {/* Status bar */}
          <div className={`px-4 py-2.5 flex items-center gap-2 text-sm font-semibold ${
            isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
          }`}>
            {isValid
              ? <><CheckCircle className="w-4 h-4" /> Verified — Active Member</>
              : <><XCircle className="w-4 h-4" /> {exp ? 'Membership Expired' : 'Not Approved'}</>}
          </div>

          <div className="p-4 space-y-3">
            {/* Member info */}
            <div className="flex items-center gap-3">
              {selected.avatar ? (
                <img src={selected.avatar} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <TierIcon className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{selected.name}</p>
                <p className="text-xs text-slate-500 capitalize">{selected.tier} member · {selected.role}</p>
                {selected.termId && (
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{formatMembershipId(selected.termId)}</p>
                )}
                {selected.validUntil && (
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${exp ? 'text-red-600' : 'text-slate-500'}`}>
                    <Clock className="w-3 h-3" />
                    {exp ? 'Expired' : 'Valid until'} {new Date(selected.validUntil).toLocaleDateString('en-KE')}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            {selected.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.badges.map((b) => (
                  <span key={b} className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-700">
                    {BADGE_META[b]?.emoji} {BADGE_META[b]?.label}
                  </span>
                ))}
              </div>
            )}

            {/* Award badge */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1.5">Award a badge</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(BADGE_META) as BadgeType[]).map((type) => {
                  const has = selected.badges.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => !has && handleAwardBadge(type)}
                      disabled={has || pending}
                      className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${
                        has
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700'
                      }`}
                    >
                      {BADGE_META[type].emoji} {BADGE_META[type].label}
                      {has && ' ✓'}
                    </button>
                  )
                })}
                {pending && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              {badgeMsg && <p className="text-xs mt-1.5 text-emerald-700">{badgeMsg}</p>}
            </div>

            {/* Membership actions */}
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-2">Membership Actions</p>
              <div className="flex flex-wrap gap-2">
                {selected.termId && (
                  <button
                    onClick={handleRenew}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg font-medium hover:bg-sky-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Renew 12 months
                  </button>
                )}
                <button
                  onClick={() => setIssueForm(issueForm ? null : { tier: selected.tier as MembershipTier, months: '12' })}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Issue membership
                </button>
              </div>

              {issueForm && (
                <form onSubmit={handleIssueMembership} className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={issueForm.tier}
                      onChange={(e) => setIssueForm({ ...issueForm, tier: e.target.value as MembershipTier })}
                      className="input text-xs flex-1"
                    >
                      <option value="basic">Classic (Basic)</option>
                      <option value="active">Premium (Active)</option>
                      <option value="champion">Gold (Champion)</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={36}
                      value={issueForm.months}
                      onChange={(e) => setIssueForm({ ...issueForm, months: e.target.value })}
                      placeholder="Months"
                      className="input text-xs w-24"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full text-xs py-1.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {pending ? 'Issuing…' : 'Issue Membership'}
                  </button>
                </form>
              )}

              {membershipMsg && <p className="text-xs mt-1.5 text-emerald-700">{membershipMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
