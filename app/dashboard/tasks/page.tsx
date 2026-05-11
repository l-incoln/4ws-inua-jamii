import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import TaskBoardClient from './TaskBoardClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Volunteer Tasks | Dashboard' }

export default async function DashboardTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Only volunteers and admins can access this page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['volunteer', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: raw } = await supabase
    .from('volunteer_tasks')
    .select(`
      id, title, description, skills_required, deadline, status,
      claimed_by, claimed_at, completed_at, created_at,
      claimer:profiles!volunteer_tasks_claimed_by_fkey ( id, full_name )
    `)
    .in('status', ['open', 'claimed', 'completed'])
    .order('created_at', { ascending: false })

  const tasks = (raw ?? []).map((t) => ({
    ...t,
    claimer: Array.isArray(t.claimer) ? (t.claimer[0] ?? null) : t.claimer,
  }))

  return (
    <TaskBoardClient
      tasks={tasks}
      currentUserId={user.id}
      userRole={profile.role}
    />
  )
}
