'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const contactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters'),
  email:   z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function submitContactMessage(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    name:    (formData.get('name') as string)?.trim(),
    email:   (formData.get('email') as string)?.trim(),
    subject: (formData.get('subject') as string)?.trim(),
    message: (formData.get('message') as string)?.trim(),
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()

  const { error } = await supabase.from('contact_messages').insert({
    name:    parsed.data.name,
    email:   parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  })

  if (error) return { error: 'Failed to send message. Please try again.' }

  return { success: true }
}
