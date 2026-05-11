import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import VolunteersClient from '@/components/admin/VolunteersClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Volunteer Tasks | Admin' }

export default async function AdminVolunteersPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('volunteer_tasks')
    .select(`
      id, title, description, skills_required, deadline, status,
      claimed_at, completed_at, created_at,
      claimer:profiles!volunteer_tasks_claimed_by_fkey ( id, full_name, avatar_url )
    `)
    .order('created_at', { ascending: false })

  const tasks = (raw ?? []).map((t) => ({
    ...t,
    claimer: Array.isArray(t.claimer) ? (t.claimer[0] ?? null) : t.claimer,
  }))

  return <VolunteersClient tasks={tasks} />
}
