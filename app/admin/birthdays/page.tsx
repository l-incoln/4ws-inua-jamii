import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AdminBirthdaysClient from '@/components/admin/AdminBirthdaysClient'
import { adminUpdateBirthday, adminDeleteBirthday } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Birthdays | Admin' }

export default async function AdminBirthdaysPage() {
  const supabase = await createClient()

  // All birthday rows joined with profile data
  const { data: birthdays } = await supabase
    .from('member_birthdays')
    .select(`
      user_id,
      birth_date,
      is_public,
      receive_greetings,
      updated_at,
      profile:profiles!member_birthdays_user_id_fkey ( full_name, avatar_url, membership_status, role )
    `)
    .order('updated_at', { ascending: false })

  // Members without birthdays (for the "add" dropdown)
  const { data: allMembers } = await supabase
    .from('profiles')
    .select('id, full_name, membership_status, role')
    .order('full_name', { ascending: true })

  const birthdaySet = new Set((birthdays ?? []).map((b) => b.user_id))
  const membersWithoutBirthday = (allMembers ?? [])
    .filter((m) => !birthdaySet.has(m.id))
    .map((m) => ({
      id: m.id,
      full_name: m.full_name,
      membership_status: m.membership_status,
      role: m.role,
    }))

  const rows = (birthdays ?? []).map((b) => ({
    user_id: b.user_id,
    birth_date: b.birth_date as string,
    is_public: b.is_public,
    receive_greetings: b.receive_greetings,
    updated_at: b.updated_at as string,
    profile: Array.isArray(b.profile) ? (b.profile[0] ?? null) : b.profile,
  }))

  return (
    <AdminBirthdaysClient
      rows={rows as any}
      membersWithoutBirthday={membersWithoutBirthday}
      adminUpdateBirthday={adminUpdateBirthday}
      adminDeleteBirthday={adminDeleteBirthday}
    />
  )
}
