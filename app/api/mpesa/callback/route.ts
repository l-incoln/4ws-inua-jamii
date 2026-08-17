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
    // Validate callback secret header set in Daraja app dashboard
    const callbackSecret = process.env.MPESA_CALLBACK_SECRET
    if (callbackSecret) {
      const incoming = req.headers.get('x-mpesa-signature') ?? req.headers.get('authorization') ?? ''
      if (incoming !== callbackSecret) {
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Forbidden' }, { status: 403 })
      }
    }

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

    // If no donation matched, try to match a membership payment.
    // The membership STK push stores the checkout_request_id in
    // profiles.payment_reference.
    if (!donation) {
      const { data: member } = await supabase
        .from('profiles')
        .update({
          payment_confirmed: true,
          payment_reference: mpesaReceiptNumber || checkoutRequestId,
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq('payment_reference', checkoutRequestId)
        .select('id, full_name, email')
        .single()

      if (member) {
        // Audit log for membership payment
        await supabase.from('mpesa_transactions').insert({
          checkout_request_id: checkoutRequestId,
          result_code: resultCode,
          receipt_number: mpesaReceiptNumber || null,
          phone_number: phoneNumber || null,
          amount,
          raw_payload: body,
        }).then(() => {})

        // Insert an in-app notification for the member
        await supabase.from('notifications').insert({
          user_id: member.id,
          type: 'general',
          title: 'Payment Confirmed',
          body: 'Your membership fee payment has been received. An admin will activate your membership shortly.',
          link: '/dashboard',
        }).then(() => {})

        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
      }
    }

    // Audit log — store raw callback for reconciliation
    await supabase.from('mpesa_transactions').insert({
      checkout_request_id: checkoutRequestId,
      result_code: resultCode,
      receipt_number: mpesaReceiptNumber || null,
      phone_number: phoneNumber || null,
      amount,
      raw_payload: body,
    }).then(() => {})

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
