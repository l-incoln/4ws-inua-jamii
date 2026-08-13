'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isPlausibleBirthDate } from '@/lib/birthdays'

export interface BirthdaySettings {
  birth_date: string | null
  is_public: boolean
  receive_greetings: boolean
}

/** Reads the signed-in member's own birthday settings. RLS blocks other rows. */
export async function getMyBirthdaySettings(): Promise<BirthdaySettings | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('member_birthdays')
    .select('birth_date, is_public, receive_greetings')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return { error: error.message }

  return {
    birth_date:        (data?.birth_date as string) ?? null,
    is_public:         data?.is_public ?? false,
    receive_greetings: data?.receive_greetings ?? true,
  }
}

/**
 * Saves the member's own birthday and celebration preferences.
 * The row is always keyed to the authenticated user, so one member can never
 * write another member's birthday even if the client is tampered with.
 */
export async function saveMyBirthday({
  birthDate,
  isPublic,
  receiveGreetings,
}: {
  birthDate: string
  isPublic: boolean
  receiveGreetings: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!isPlausibleBirthDate(birthDate)) {
    return { error: 'Enter a valid date of birth in the past.' }
  }

  const { error } = await supabase
    .from('member_birthdays')
    .upsert({
      user_id:           user.id,
      birth_date:        birthDate,
      is_public:         isPublic,
      receive_greetings: receiveGreetings,
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

/** Removes the stored birthday entirely — the member's right to withdraw. */
export async function deleteMyBirthday() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('member_birthdays')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}
