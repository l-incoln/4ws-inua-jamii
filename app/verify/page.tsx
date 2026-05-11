import { createClient } from '@/lib/supabase/server'
import { Shield, Star, Award, Search, CheckCircle, XCircle, Clock, Mail, CreditCard } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { isExpired, formatMembershipId } from '@/lib/membership'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Verify Membership | 4W\'S Inua Jamii Foundation',
}

const TIER_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  basic:    { label: 'Classic',  icon: Shield, color: 'text-sky-600' },
  active:   { label: 'Premium',  icon: Star,   color: 'text-emerald-600' },
  champion: { label: 'Gold',     icon: Award,  color: 'text-amber-600' },
}

interface PageProps {
  searchParams: Promise<{ q?: string; method?: string }>
}

export default async function VerifyHubPage({ searchParams }: PageProps) {
  const { q, method = 'id' } = await searchParams
  const supabase = await createClient()

  let result: null | {
    found: boolean
    name?: string
    avatar?: string | null
    tier?: string
    status?: string
    validUntil?: string | null
    verifyUrl?: string
    error?: string
  } = null

  if (q && q.trim()) {
    const query = q.trim()

    if (method === 'email') {
      // Verify by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, tier, membership_status')
        .eq('membership_status', 'approved')
        .ilike('id', '%') // just get all approved, then filter by auth email
        .limit(200)
        .maybeSingle()

      // Actually we need to join with auth.users for email — use a safer approach
      // Search by name for now (email is in auth.users, not profiles)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, tier, membership_status')
        .eq('membership_status', 'approved')
        .ilike('full_name', `%${query}%`)
        .limit(5)

      if (profiles && profiles.length > 0) {
        const p = profiles[0]
        const { data: term } = await supabase
          .from('membership_terms')
          .select('valid_until, is_active')
          .eq('user_id', p.id)
          .eq('is_active', true)
          .maybeSingle()

        result = {
          found: true,
          name: p.full_name ?? 'Member',
          avatar: p.avatar_url,
          tier: p.tier,
          status: p.membership_status,
          validUntil: term?.valid_until ?? null,
        }
      } else {
        result = { found: false }
      }
    } else {
      // Verify by Member ID (format: 4WS-XXXXXXXX or raw UUID prefix)
      const normalised = query.toUpperCase().replace('4WS-', '')

      const { data: terms } = await supabase
        .from('membership_terms')
        .select(`
          id, tier, valid_until, is_active,
          profiles ( full_name, avatar_url, membership_status )
        `)
        .eq('is_active', true)
        .limit(200)

      const match = terms?.find((t) => t.id.slice(0, 8).toUpperCase() === normalised)

      if (match) {
        const p = Array.isArray(match.profiles) ? match.profiles[0] : match.profiles
        result = {
          found: true,
          name: p?.full_name ?? 'Member',
          avatar: p?.avatar_url ?? null,
          tier: match.tier,
          status: p?.membership_status ?? 'approved',
          validUntil: match.valid_until,
        }
      } else {
        result = { found: false }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Membership Verification</h1>
          <p className="text-slate-300 mt-2 text-sm">
            Verify any 4W&apos;S Inua Jamii Foundation member in seconds
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-8">

        {/* Search form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Look up a Member</h2>

          <form method="GET" className="space-y-3">
            {/* Method toggle */}
            <div className="flex gap-2">
              {[
                { value: 'id',    label: 'Member ID',  icon: CreditCard },
                { value: 'email', label: 'Name',       icon: Mail },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="submit"
                  name="method"
                  value={value}
                  formNoValidate
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    method === value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ''}
                placeholder={method === 'id' ? 'Enter Member ID (e.g. 4WS-A1B2C3D4)…' : 'Enter member name…'}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoComplete="off"
              />
              <input type="hidden" name="method" value={method} />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Verify Member
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${
            result.found && result.validUntil && !isExpired(result.validUntil)
              ? 'border-emerald-200'
              : result.found ? 'border-amber-200' : 'border-red-200'
          }`}>
            {result.found ? (() => {
              const cfg = TIER_CONFIG[result.tier ?? 'basic'] ?? TIER_CONFIG.basic
              const TierIcon = cfg.icon
              const exp = result.validUntil ? isExpired(result.validUntil) : true
              const isValid = !exp && result.status === 'approved'

              return (
                <>
                  <div className={`px-5 py-3 flex items-center gap-2 text-sm font-semibold ${
                    isValid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {isValid
                      ? <><CheckCircle className="w-4 h-4" /> Verified — Active Member</>
                      : <><Clock className="w-4 h-4" /> Member Found — Membership Expired</>}
                  </div>
                  <div className="p-5 flex items-center gap-4">
                    {result.avatar ? (
                      <img src={result.avatar} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <TierIcon className={`w-7 h-7 ${cfg.color}`} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg">{result.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <TierIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        <span className="text-sm text-slate-600">{cfg.label} Member</span>
                      </div>
                      {result.validUntil && (
                        <p className={`text-xs mt-1 ${exp ? 'text-red-600' : 'text-slate-500'}`}>
                          {exp ? 'Expired' : 'Valid until'} {new Date(result.validUntil).toLocaleDateString('en-KE', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )
            })() : (
              <div className="p-6 text-center">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="font-semibold text-slate-900">No active member found</p>
                <p className="text-sm text-slate-500 mt-1">
                  No approved member matches &quot;{q}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Alternative methods callout */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-slate-900 text-sm">Other Verification Methods</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span><strong>QR Code Scan</strong> — Scan the QR on their membership card. The link is cryptographically signed and cannot be faked.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span><strong>Member ID Lookup</strong> — Enter the 4WS-XXXXXXXX ID from their card above.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span><strong>Admin Panel</strong> — Staff can search the full member database in the <Link href="/admin/members" className="text-primary-600 underline">Admin → Members</Link> section.</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          4W&apos;S Inua Jamii Foundation · Membership Verification System
        </p>
      </div>
    </div>
  )
}
