import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import dynamicImport from 'next/dynamic'
import { getSignedVerifyUrl } from '@/lib/membership-server'

// Disable SSR — the card uses browser-only APIs (canvas for QR, DOM for html-to-image)
const MembershipCardClient = dynamicImport(() => import('./MembershipCardClient'), { ssr: false })

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
    .select('id, tier, valid_from, valid_until, issued_at, is_active, membership_tokens(id, token)')
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

  const token =
    activeTerm &&
    Array.isArray(activeTerm.membership_tokens) &&
    activeTerm.membership_tokens[0]?.token
      ? activeTerm.membership_tokens[0].token
      : null

  const verifyUrl = token ? getSignedVerifyUrl(token) : null

  const [eventsRes, badgesRes] = await Promise.all([
    supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'confirmed'),
    supabase
      .from('member_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  return (
    <MembershipCardClient
      profile={{ ...profile, email: user.email ?? '' }}
      activeTerm={activeTerm ?? null}
      verifyUrl={verifyUrl}
      history={history ?? []}
      eventsCount={eventsRes.count ?? 0}
      badgesCount={badgesRes.count ?? 0}
    />
  )
}
