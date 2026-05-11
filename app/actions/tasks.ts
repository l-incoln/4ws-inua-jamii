'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimTask(taskId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // Only volunteers and admins can claim tasks
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, membership_status')
    .eq('id', user.id)
    .single()

  if (!profile || !['volunteer', 'admin'].includes(profile.role)) {
    return { error: 'Only volunteers and admins can claim tasks.' }
  }

  // Check task is still open
  const { data: task } = await supabase
    .from('volunteer_tasks')
    .select('status')
    .eq('id', taskId)
    .single()

  if (!task) return { error: 'Task not found.' }
  if (task.status !== 'open') return { error: 'This task is no longer available.' }

  const { error } = await supabase
    .from('volunteer_tasks')
    .update({ status: 'claimed', claimed_by: user.id, claimed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('status', 'open') // optimistic concurrency guard

  if (error) return { error: 'Failed to claim task. It may have been taken already.' }

  revalidatePath('/dashboard/tasks')
  return { success: true }
}

export async function unclaimTask(taskId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('volunteer_tasks')
    .update({ status: 'open', claimed_by: null, claimed_at: null })
    .eq('id', taskId)
    .eq('claimed_by', user.id) // only the claimer can unclaim

  if (error) return { error: error.message }
  revalidatePath('/dashboard/tasks')
  return { success: true }
}

export async function submitTaskCompletion(taskId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('volunteer_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('claimed_by', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/tasks')
  return { success: true }
}
