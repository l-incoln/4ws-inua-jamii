import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import MembersTable from '@/components/admin/MembersTable'

export const metadata: Metadata = { title: 'Member Management' }

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone, tier, membership_status, created_at')
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

  const membersWithCounts = members.map((m) => ({
    ...m,
    membership_status: (m as Record<string, string>).membership_status ?? 'pending',
    rsvp_count: rsvpCounts[m.id] || 0,
  }))

  return <MembersTable members={membersWithCounts} />
}
