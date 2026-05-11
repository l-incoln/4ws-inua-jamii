'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const applicationSchema = z.object({
  motivation:   z.string().min(20, 'Please tell us more about why you want to join (min 20 characters)').max(1000),
  availability: z.string().max(200).optional(),
})

export async function applyToProgram(
  programId: string,
  motivation: string,
  availability?: string
): Promise<{ error?: string; success?: boolean; alreadyApplied?: boolean }> {
  const parsed = applicationSchema.safeParse({ motivation, availability })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to apply.' }

  // Check if already applied
  const { data: existing } = await supabase
    .from('program_applications')
    .select('id, status')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { alreadyApplied: true, error: `You have already applied — current status: ${existing.status}` }

  const { error } = await supabase.from('program_applications').insert({
    program_id:   programId,
    user_id:      user.id,
    motivation:   parsed.data.motivation,
    availability: parsed.data.availability ?? null,
  })

  if (error) return { error: 'Failed to submit application. Please try again.' }

  revalidatePath(`/programs`)
  return { success: true }
}

export async function cancelApplication(
  applicationId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('program_applications')
    .delete()
    .eq('id', applicationId)
    .eq('user_id', user.id) // ensure ownership

  if (error) return { error: error.message }
  revalidatePath('/programs')
  return { success: true }
}
