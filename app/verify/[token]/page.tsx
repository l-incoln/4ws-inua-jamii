import { createClient } from '@/lib/supabase/server'
import { Shield, Star, Award, CheckCircle, XCircle, Calendar, Clock, ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { isExpired, formatMembershipId } from '@/lib/membership'
import { verifyTokenSignature } from '@/lib/membership-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Membership Verification | 4W\'S Inua Jamii Foundation' }

const TIER_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string }> = {
  basic:    { label: 'Classic Member',  icon: Shield, gradient: 'from-sky-500 to-blue-600' },
  active:   { label: 'Premium Member',  icon: Star,   gradient: 'from-green-500 to-emerald-600' },
  champion: { label: 'Gold Member',     icon: Award,  gradient: 'from-amber-400 to-orange-600' },
}

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ sig?: string }>
}

export default async function VerifyMembershipPage({ params, searchParams }: Props) {
  const { token } = await params
  const { sig } = await searchParams

  // ── HMAC Security Gate ────────────────────────────────────────────────────
  // Reject requests without a valid HMAC signature — prevents brute-force DB probing
  const signatureValid = sig ? verifyTokenSignature(token, sig) : false

  if (!signatureValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Invalid Verification Link</h1>
          <p className="text-slate-500 text-sm">
            This QR code or link is tampered, expired, or not issued by the foundation.
          </p>
          <Link href="/verify" className="inline-block btn-primary text-sm mt-2">
            Verify by Member ID instead
          </Link>
        </div>
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────────────────

  const supabase = await createClient()
  const { data: tokenRecord } = await supabase
    .from('membership_tokens')
    .select(`
      token,
      created_at,
      membership_terms (
        id,
        tier,
        valid_from,
        valid_until,
        is_active,
        issued_at,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      )
    `)
    .eq('token', token)
    .maybeSingle()

  if (!tokenRecord || !tokenRecord.membership_terms) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Invalid Verification Link</h1>
          <p className="text-slate-500 text-sm">
            This membership verification link is invalid or has expired.
          </p>
          <Link href="/" className="inline-block btn-primary text-sm mt-2">
            Return to Foundation
          </Link>
        </div>
      </div>
    )
  }

  const term = Array.isArray(tokenRecord.membership_terms)
    ? tokenRecord.membership_terms[0]
    : tokenRecord.membership_terms

  const profile = Array.isArray(term.profiles) ? term.profiles[0] : term.profiles

  const expired = isExpired(term.valid_until)
  const isValid = term.is_active && !expired

  const config = TIER_CONFIG[term.tier] ?? TIER_CONFIG.basic
  const TierIcon = config.icon

  const validFrom = new Date(term.valid_from).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const validUntil = new Date(term.valid_until).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const ROLE_LABELS: Record<string, string> = {
    member: 'Member', volunteer: 'Volunteer', admin: 'Administrator',
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${config.gradient} p-6 text-center relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-4 border-white/30 mx-auto mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <TierIcon className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-white font-bold text-xl">{profile?.full_name ?? 'Member'}</h1>
            <p className="text-white/80 text-sm mt-0.5">{ROLE_LABELS[profile?.role ?? 'member'] ?? 'Member'}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 text-white text-sm px-3 py-1 rounded-full">
              <TierIcon className="w-3.5 h-3.5" />
              {config.label}
            </div>
          </div>
        </div>

        {/* Verification status */}
        <div className="p-6 space-y-4">
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${
            isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {isValid ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isValid ? 'Membership Verified' : expired ? 'Membership Expired' : 'Membership Inactive'}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {isValid
                  ? 'This is an authentic, active member of the foundation.'
                  : expired
                  ? 'This membership term has ended.'
                  : 'This membership is no longer active.'}
              </p>
            </div>
          </div>

          {/* Dates + Member ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" /> Valid from
              </span>
              <span className="font-medium text-slate-900">{validFrom}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4" /> Valid until
              </span>
              <span className={`font-medium ${expired ? 'text-red-600' : 'text-slate-900'}`}>
                {validUntil}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-slate-50 pt-2">
              <span className="text-slate-500">Member ID</span>
              <span className="font-mono font-bold text-slate-900 text-xs tracking-widest">{formatMembershipId(term.id)}</span>
            </div>
          </div>

          {/* Foundation branding + profile link */}
          <div className="border-t border-slate-100 pt-4 text-center space-y-2">
            <p className="text-xs text-slate-400">Verified by</p>
            <p className="font-bold text-slate-800">4W&apos;S Inua Jamii Foundation</p>
            <Link href="/" className="text-xs text-primary-600 hover:underline inline-block">
              www.4wsinuajamii.org
            </Link>
            {profile?.id && (
              <div className="pt-2">
                <Link
                  href={`/members/${profile.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-semibold hover:underline"
                >
                  View Public Profile &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
