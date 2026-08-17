import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import MembershipCardClient from './MembershipCardWrapper'
import { getSignedVerifyUrl } from '@/lib/membership-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Membership Card | Dashboard' }

export default async function MembershipCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, bio, location, tier, membership_status, role, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { data: activeTerm } = await supabase
    .from('membership_terms')
    .select('id, tier, valid_from, valid_until, issued_at, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: history } = await supabase
    .from('membership_terms')
    .select('id, tier, valid_from, valid_until, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Query token directly to avoid PostgREST nested-join shape ambiguity
  let verifyUrl: string | null = null
  let hmacError = false
  if (activeTerm) {
    const { data: tokenRow } = await supabase
      .from('membership_tokens')
      .select('token')
      .eq('user_id', user.id)
      .eq('term_id', activeTerm.id)
      .maybeSingle()
    if (tokenRow?.token) {
      try {
        verifyUrl = getSignedVerifyUrl(tokenRow.token)
      } catch {
        // MEMBERSHIP_HMAC_SECRET not configured — surface to client
        hmacError = true
      }
    }
  }

  const [eventsRes, badgesRes, settingsRes] = await Promise.all([
    supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'confirmed'),
    supabase
      .from('member_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['logo_url']),
  ])

  const logoUrl = settingsRes.data?.find((r) => r.key === 'logo_url')?.value ?? null

  return (
    <MembershipCardClient
      profile={{ ...profile, email: user.email ?? '' }}
      activeTerm={activeTerm ?? null}
      verifyUrl={verifyUrl}
      hmacError={hmacError}
      history={history ?? []}
      eventsCount={eventsRes.count ?? 0}
      badgesCount={badgesRes.count ?? 0}
      logoUrl={logoUrl}
    />
  )
}
