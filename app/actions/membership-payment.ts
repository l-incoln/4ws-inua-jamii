'use server'

import { createClient } from '@/lib/supabase/server'
import { initiateStkPush } from '@/lib/mpesa'
import { normaliseKePhone } from '@/lib/phone'
import { revalidatePath } from 'next/cache'

/**
 * Initiate M-Pesa STK push for a membership fee payment.
 *
 * Flow:
 * 1. Get the current user and their selected_tier
 * 2. Look up the fee for that tier from site_settings
 * 3. Normalise the phone number (user must provide one if not on profile)
 * 4. Call initiateStkPush with a MEM- prefixed reference
 * 5. Store the checkout_request_id in profiles.payment_reference
 *    so the M-Pesa callback can match it back to this member
 */
export async function initiateMembershipPayment(
  phoneOverride?: string,
): Promise<{ error?: string; success?: boolean; checkoutRequestId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to pay.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, phone, selected_tier, tier, membership_status, payment_confirmed')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }
  if (profile.payment_confirmed) return { error: 'Your payment has already been confirmed.' }

  const tier = profile.selected_tier || profile.tier || 'basic'

  // Look up the fee and currency from site_settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      `membership_fee_${tier}`,
      'membership_currency',
    ])

  const settingsMap: Record<string, string> = {}
  for (const row of settings ?? []) settingsMap[row.key] = row.value

  const feeStr = settingsMap[`membership_fee_${tier}`]
  const fee = Number(feeStr)
  if (!Number.isFinite(fee) || fee <= 0) {
    return { error: `Membership fee for ${tier} tier is not configured. Please contact the foundation.` }
  }

  // Resolve phone: override > profile.phone
  const rawPhone = (phoneOverride || profile.phone || '').trim()
  if (!rawPhone) {
    return { error: 'Please provide a phone number to receive the M-Pesa prompt.' }
  }

  const phone = normaliseKePhone(rawPhone)
  if (!phone) {
    return { error: 'Please provide a valid Safaricom phone number (e.g. 07XX XXX XXX).' }
  }

  // Generate a membership payment reference (max 12 chars for AccountReference)
  const ref = `MEM-${user.id.slice(0, 8).toUpperCase()}`

  const stkResult = await initiateStkPush({
    phone,
    amount: fee,
    reference: ref,
    description: 'Membership Fee',
  })

  if (!stkResult.success || !stkResult.checkoutRequestId) {
    return { error: stkResult.error ?? 'M-Pesa STK push failed. Please try again.' }
  }

  // Store the checkout request ID so the callback can match this member
  // We use payment_reference to hold the checkout_request_id temporarily.
  // The callback will replace it with the M-Pesa receipt number on success.
  await supabase
    .from('profiles')
    .update({ payment_reference: stkResult.checkoutRequestId })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  return { success: true, checkoutRequestId: stkResult.checkoutRequestId }
}
