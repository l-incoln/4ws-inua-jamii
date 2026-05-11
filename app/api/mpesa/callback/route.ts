import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { sendEmail, donationReceiptHtml } from '@/lib/email'

/**
 * M-Pesa Daraja STK Push Callback
 * Register this URL in your Daraja app:
 *   https://yourdomain.com/api/mpesa/callback
 *
 * Environment variables required:
 *   MPESA_CALLBACK_SECRET  – a random string you set in Daraja as CallbackURL secret header
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Daraja sends the result inside Body.stkCallback
    const callback = body?.Body?.stkCallback
    if (!callback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' })
    }

    const resultCode: number = callback.ResultCode
    const checkoutRequestId: string = callback.CheckoutRequestID

    const supabase = createAdminClient()

    if (resultCode !== 0) {
      // Payment failed or cancelled – mark donation as failed
      await supabase
        .from('donations')
        .update({ status: 'failed' })
        .eq('reference', checkoutRequestId)

      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // Extract metadata items from successful callback
    const items: { Name: string; Value: string | number }[] =
      callback.CallbackMetadata?.Item ?? []

    const get = (name: string) => items.find((i) => i.Name === name)?.Value

    const amount        = Number(get('Amount') ?? 0)
    const mpesaReceiptNumber = String(get('MpesaReceiptNumber') ?? '')
    const phoneNumber   = String(get('PhoneNumber') ?? '')

    // Mark matching donation as completed
    const { data: donation } = await supabase
      .from('donations')
      .update({
        status: 'completed',
        reference: mpesaReceiptNumber || checkoutRequestId,
      })
      .eq('reference', checkoutRequestId)
      .select('donor_name, donor_email, amount')
      .single()

    // Send receipt email if we have donor details
    if (donation?.donor_email) {
      await sendEmail({
        to: donation.donor_email,
        subject: 'Your Inua Jamii Donation Receipt',
        html: donationReceiptHtml({
          name:      donation.donor_name ?? 'Donor',
          amount:    donation.amount,
          reference: mpesaReceiptNumber || checkoutRequestId,
          date:      new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }),
        }),
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err) {
    console.error('[mpesa/callback]', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
