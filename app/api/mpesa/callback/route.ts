import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { sendEmail, donationReceiptHtml, membershipReceiptHtml, escapeHtml, emailLayout, emailButton, ORG_NAME } from '@/lib/email'
import { getEmailSettings, senderFor } from '@/lib/email-settings'

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
    // Validate callback secret header set in Daraja app dashboard.
    // The secret is MANDATORY in production — without it anyone could
    // forge a callback and mark payments as complete.
    const callbackSecret = process.env.MPESA_CALLBACK_SECRET
    const isDev = process.env.NODE_ENV !== 'production'

    if (!callbackSecret) {
      if (!isDev) {
        console.error('[mpesa/callback] MPESA_CALLBACK_SECRET is not set — rejecting callback in production')
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Server not configured' }, { status: 500 })
      }
      // In development, allow through with a warning so local testing works
      console.warn('[mpesa/callback] MPESA_CALLBACK_SECRET is not set — allowing in development only')
    } else {
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
      const { data: failedDonation } = await supabase
        .from('donations')
        .update({ status: 'failed' })
        .eq('reference', checkoutRequestId)
        .select('donor_name, donor_email, amount, campaign_title')
        .single()

      // Also check if it was a membership payment
      const { data: failedMember } = await supabase
        .from('profiles')
        .select('id, full_name, email, selected_tier')
        .eq('payment_reference', checkoutRequestId)
        .single()

      // Notify admins about the failed payment.
      // System alert → sent from no-reply@ (automation) to admin@.
      const settings = await getEmailSettings(supabase)
      const noReply = senderFor(settings, 'no-reply')
      if (settings.adminEmails.length) {
        const isDonation = !!failedDonation
        const name = failedDonation?.donor_name ?? failedMember?.full_name ?? 'Unknown'
        const amount = failedDonation?.amount ?? 'Unknown'
        await sendEmail({
          to: settings.adminEmails,
          from: noReply.from,
          subject: `[Payment Alert] Failed M-Pesa payment — ${checkoutRequestId}`,
          html: adminPaymentAlertHtml({
            type: 'Payment Failed',
            name,
            amount: String(amount),
            reference: checkoutRequestId,
            context: isDonation ? 'Donation' : 'Membership Payment',
            status: 'failed',
            resultCode: String(resultCode),
          }),
        }).catch(() => {})
      }

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
        .select('id, full_name, email, selected_tier, tier')
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

        // Send receipt email to the member.
        // Receipt → sent from no-reply@ (automation, no reply-to).
        if (member.email) {
          const receiptSettings = await getEmailSettings(supabase)
          const receiptNoReply = senderFor(receiptSettings, 'no-reply')
          await sendEmail({
            to: member.email,
            from: receiptNoReply.from,
            subject: 'Your 4W\'S Inua Jamii Membership Payment Receipt',
            html: membershipReceiptHtml({
              name:      member.full_name ?? 'Member',
              tier:      member.selected_tier || member.tier || 'basic',
              amount,
              reference: mpesaReceiptNumber || checkoutRequestId,
              date:      new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }),
            }),
          }).catch(() => {})
        }

        // Notify admins about the membership payment.
        // Payment alert → sent from no-reply@ (automation) to admin@.
        const memberSettings = await getEmailSettings(supabase)
        const memberNoReply = senderFor(memberSettings, 'no-reply')
        if (memberSettings.adminEmails.length) {
          await sendEmail({
            to: memberSettings.adminEmails,
            from: memberNoReply.from,
            subject: `[Membership Payment] ${member.full_name ?? 'Member'} — KES ${amount}`,
            html: adminPaymentAlertHtml({
              type: 'Membership Payment Confirmed',
              name: member.full_name ?? 'Member',
              amount: String(amount),
              reference: mpesaReceiptNumber || checkoutRequestId,
              context: 'Membership Payment',
              status: 'completed',
              extra: `Tier: ${member.selected_tier || member.tier || 'basic'}`,
            }),
          }).catch(() => {})
        }

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

    // Send receipt email if we have donor details.
    // Receipt → sent from no-reply@ (automation, no reply-to).
    if (donation?.donor_email) {
      const donorSettings = await getEmailSettings(supabase)
      const donorNoReply = senderFor(donorSettings, 'no-reply')
      await sendEmail({
        to: donation.donor_email,
        from: donorNoReply.from,
        subject: 'Your Inua Jamii Donation Receipt',
        html: donationReceiptHtml({
          name:      donation.donor_name ?? 'Donor',
          amount:    donation.amount,
          reference: mpesaReceiptNumber || checkoutRequestId,
          date:      new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }),
        }),
      })
    }

    // Notify admins about the donation.
    // Payment alert → sent from no-reply@ (automation) to admin@.
    if (donation) {
      const donationSettings = await getEmailSettings(supabase)
      const donationNoReply = senderFor(donationSettings, 'no-reply')
      if (donationSettings.adminEmails.length) {
        await sendEmail({
          to: donationSettings.adminEmails,
          from: donationNoReply.from,
          subject: `[Donation] ${donation.donor_name ?? 'Anonymous'} — KES ${donation.amount}`,
          html: adminPaymentAlertHtml({
            type: 'New Donation Received',
            name: donation.donor_name ?? 'Anonymous',
            amount: String(donation.amount),
            reference: mpesaReceiptNumber || checkoutRequestId,
            context: 'Donation',
            status: 'completed',
          }),
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err) {
    console.error('[mpesa/callback]', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}

// ---------------------------------------------------------------------------
// Admin payment alert email template
// ---------------------------------------------------------------------------
function adminPaymentAlertHtml(opts: {
  type: string
  name: string
  amount: string
  reference: string
  context: string
  status: string
  resultCode?: string
  extra?: string
}) {
  const statusColor = opts.status === 'completed' ? '#16a34a' : '#dc2626'
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hello Admin,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      A ${opts.context.toLowerCase()} transaction has been updated:
    </p>
    <div style="background:#f8fafc;border-left:4px solid ${statusColor};border-radius:6px;padding:16px 20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Type:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.type)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Name:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.name)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Amount:</td><td style="padding:4px 0;font-size:14px;color:#334155;">KES ${escapeHtml(opts.amount)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Reference:</td><td style="padding:4px 0;font-size:14px;color:#334155;font-family:monospace;">${escapeHtml(opts.reference)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Status:</td><td style="padding:4px 0;font-size:14px;color:${statusColor};font-weight:700;">${escapeHtml(opts.status)}</td></tr>
        ${opts.resultCode ? `<tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Result Code:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.resultCode)}</td></tr>` : ''}
        ${opts.extra ? `<tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Details:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.extra)}</td></tr>` : ''}
      </table>
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:20px;">
      This is an automated notification from the ${ORG_NAME} payment system.
    </p>
  `
  return emailLayout({
    headerTitle:    opts.type,
    headerSubtitle: 'Admin Notification',
    headerColor:    statusColor,
    body,
  })
}
