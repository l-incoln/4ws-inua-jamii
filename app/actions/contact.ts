'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const contactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:   z.string().email('Please enter a valid email address').max(200),
  subject: z.string().min(3, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
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

  // Rate-limit: max 3 messages per email per hour
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
  const { count } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('email', parsed.data.email)
    .gte('created_at', oneHourAgo)

  if ((count ?? 0) >= 3) {
    return { error: 'You have sent too many messages recently. Please try again later.' }
  }

  const { error } = await supabase.from('contact_messages').insert({
    name:    parsed.data.name,
    email:   parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  })

  if (error) return { error: 'Failed to send message. Please try again.' }

  return { success: true }
}
