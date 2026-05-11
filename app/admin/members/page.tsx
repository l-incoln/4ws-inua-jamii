import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MembersTable from '@/components/admin/MembersTable'
import MemberVerificationPanel from '@/components/admin/MemberVerificationPanel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Member Management' }

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone, tier, membership_status, role, avatar_url, created_at')
    .order('created_at', { ascending: false })

  const members = profiles ?? []

  // Fetch RSVP counts per member
  let rsvpCounts: Record<string, number> = {}
  if (members.length > 0) {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .in('user_id', members.map((m) => m.id))
      .eq('status', 'confirmed')

    if (rsvps) {
      for (const r of rsvps) {
        rsvpCounts[r.user_id] = (rsvpCounts[r.user_id] || 0) + 1
      }
    }
  }

  // Fetch active membership terms for verification panel
  const { data: terms } = await supabase
    .from('membership_terms')
    .select('id, user_id, valid_until, is_active')
    .in('user_id', members.map((m) => m.id))

  // Fetch badges for verification panel
  const { data: badges } = await supabase
    .from('member_badges')
    .select('user_id, badge_type')
    .in('user_id', members.map((m) => m.id))

  const termsByUser: Record<string, { id: string; valid_until: string; is_active: boolean }[]> = {}
  for (const t of (terms ?? [])) {
    if (!termsByUser[t.user_id]) termsByUser[t.user_id] = []
    termsByUser[t.user_id].push({ id: t.id, valid_until: t.valid_until, is_active: t.is_active })
  }

  const badgesByUser: Record<string, string[]> = {}
  for (const b of (badges ?? [])) {
    if (!badgesByUser[b.user_id]) badgesByUser[b.user_id] = []
    badgesByUser[b.user_id].push(b.badge_type)
  }

  const membersWithCounts = members.map((m) => ({
    ...m,
    membership_status: (m as Record<string, string>).membership_status ?? 'pending',
    rsvp_count: rsvpCounts[m.id] || 0,
  }))

  const panelMembers = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    tier: m.tier,
    membership_status: m.membership_status ?? 'pending',
    avatar_url: m.avatar_url,
    role: m.role,
    terms: termsByUser[m.id] ?? [],
    badges: badgesByUser[m.id] ?? [],
  }))

  return (
    <div className="space-y-8">
      <MemberVerificationPanel members={panelMembers} />
      <MembersTable members={membersWithCounts} />
    </div>
  )
}
