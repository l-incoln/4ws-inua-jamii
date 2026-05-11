import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ApplicationsClient from '@/components/admin/ApplicationsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Program Applications | Admin' }

export default async function AdminApplicationsPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('program_applications')
    .select(`
      id, motivation, availability, status, admin_note, created_at,
      programs ( id, title, slug ),
      profiles ( id, full_name, email, phone, avatar_url )
    `)
    .order('created_at', { ascending: false })

  // Supabase returns joined rows as arrays; normalise to single object | null
  const applications = (raw ?? []).map((a) => ({
    ...a,
    programs: Array.isArray(a.programs) ? (a.programs[0] ?? null) : a.programs,
    profiles: Array.isArray(a.profiles) ? (a.profiles[0] ?? null) : a.profiles,
  }))

  return <ApplicationsClient applications={applications} />
}
