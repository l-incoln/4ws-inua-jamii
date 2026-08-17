'use server'

import { createClient } from '@/lib/supabase/server'
import { initiateStkPush } from '@/lib/mpesa'
import { normaliseKePhone } from '@/lib/phone'
import { z } from 'zod'

const donationSchema = z.object({
  amount:         z.number({ invalid_type_error: 'Amount is required' }).positive('Amount must be positive'),
  first_name:     z.string().min(1, 'First name is required'),
  last_name:      z.string().min(1, 'Last name is required'),
  email:          z.string().email('Please enter a valid email address'),
  phone:          z.string().optional(),
  message:        z.string().optional(),
  is_anonymous:   z.boolean().default(false),
  payment_method: z.enum(['mpesa', 'card', 'bank', 'cash']),
  campaign_id:    z.string().uuid().optional().nullable(),
})

export async function submitDonation(
  data: z.infer<typeof donationSchema>
): Promise<{ error?: string; success?: boolean; reference?: string; stkPushed?: boolean }> {
  const parsed = donationSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Idempotency: check for an existing pending M-Pesa donation from the same
  // user with the same amount in the last 5 minutes. If found, return it
  // instead of creating a duplicate.
  if (parsed.data.payment_method === 'mpesa' && user) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('donations')
      .select('reference')
      .eq('donor_id', user.id)
      .eq('amount', parsed.data.amount)
      .eq('status', 'pending')
      .eq('payment_method', 'mpesa')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { success: true, reference: existing.reference, stkPushed: true }
    }
  }

  const reference = `DON-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

  const { error } = await supabase.from('donations').insert({
    campaign_id:    parsed.data.campaign_id ?? null,
    donor_id:       user?.id ?? null,
    donor_name:     parsed.data.is_anonymous ? null : `${parsed.data.first_name} ${parsed.data.last_name}`,
    donor_email:    parsed.data.is_anonymous ? null : parsed.data.email,
    amount:         parsed.data.amount,
    currency:       'KES',
    payment_method: parsed.data.payment_method,
    reference,
    status:         'pending',
    is_anonymous:   parsed.data.is_anonymous,
    message:        parsed.data.message ?? null,
  })

  if (error) return { error: 'Failed to record donation. Please try again.' }

  // Attempt M-Pesa STK push if credentials are configured
  let stkPushed = false
  if (parsed.data.payment_method === 'mpesa' && parsed.data.phone) {
    const phone = normaliseKePhone(parsed.data.phone)
    if (!phone) {
      return { error: 'Please enter a valid Safaricom phone number (e.g. 07XX XXX XXX).' }
    }

    const stkResult = await initiateStkPush({
      phone,
      amount:      parsed.data.amount,
      reference,
      description: 'Inua Jamii Donation',
    })

    if (stkResult.success && stkResult.checkoutRequestId) {
      // Store the checkout request ID so the callback can match the donation
      await supabase
        .from('donations')
        .update({ reference: stkResult.checkoutRequestId })
        .eq('reference', reference)
      stkPushed = true
    } else if (stkResult.error) {
      return { error: stkResult.error }
    }
  }

  return { success: true, reference, stkPushed }
}
