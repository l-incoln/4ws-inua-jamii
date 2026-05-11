/**
 * Email utility using Resend (https://resend.com)
 *
 * Required environment variables (.env.local):
 *   RESEND_API_KEY   – API key from resend.com (free tier: 3 000 emails/month)
 *   EMAIL_FROM       – Sender address, e.g. "Inua Jamii <noreply@yourdomain.com>"
 *                      Domain must be verified in Resend dashboard
 *
 * Fall-through: if RESEND_API_KEY is not set the function logs a warning and
 * returns { success: false } instead of throwing, so the rest of the app still
 * works during local development without email configured.
 */

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.EMAIL_FROM ?? 'Inua Jamii <noreply@example.com>'

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email skipped')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to:      Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html:    opts.html,
        reply_to: opts.replyTo,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[email] Resend error', data)
      return { success: false, error: data.message ?? 'Send failed' }
    }

    return { success: true, id: data.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[email]', msg)
    return { success: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

export function donationReceiptHtml({
  name,
  amount,
  reference,
  date,
}: {
  name: string
  amount: number
  reference: string
  date: string
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#16a34a;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:24px;">Donation Receipt</h1>
      <p style="margin:8px 0 0;color:#dcfce7;font-size:14px;">Inua Jamii Pamoja Initiative</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#334155;font-size:15px;">Dear <strong>${name}</strong>,</p>
      <p style="color:#334155;font-size:15px;">
        Thank you for your generous donation. Your contribution makes a real difference in our community.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Amount</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">KES ${amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Reference</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;font-family:monospace;">${reference}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b;font-size:14px;">Date</td>
          <td style="padding:10px 0;color:#0f172a;font-size:14px;text-align:right;">${date}</td>
        </tr>
      </table>
      <p style="color:#64748b;font-size:13px;margin-top:28px;">
        This email serves as your official donation receipt. Please keep it for your records.
      </p>
    </div>
    <div style="padding:20px 40px;background:#f1f5f9;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Inua Jamii Pamoja Initiative · Kenya</p>
    </div>
  </div>
</body>
</html>`
}

export function welcomeEmailHtml({ name }: { name: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#16a34a;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:24px;">Welcome to Inua Jamii!</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#334155;font-size:15px;">Hi <strong>${name}</strong>,</p>
      <p style="color:#334155;font-size:15px;">
        We're thrilled to have you join the Inua Jamii Pamoja Initiative community.
        Your membership gives you access to events, programs, and a network of change-makers across Kenya.
      </p>
      <p style="color:#334155;font-size:15px;">Visit your member dashboard to complete your profile and explore upcoming events.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/dashboard"
         style="display:inline-block;margin-top:16px;padding:12px 28px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Go to Dashboard
      </a>
    </div>
    <div style="padding:20px 40px;background:#f1f5f9;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Inua Jamii Pamoja Initiative · Kenya</p>
    </div>
  </div>
</body>
</html>`
}
