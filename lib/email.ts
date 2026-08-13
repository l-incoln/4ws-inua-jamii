/**
 * Email utility using Resend (https://resend.com)
 *
 * Required environment variables:
 *   RESEND_API_KEY          – API key from resend.com
 *   EMAIL_FROM              – Verified sender, e.g. "4W'S Inua Jamii Foundation <noreply@yourdomain.com>"
 *   EMAIL_REPLY_TO          – Reply-to address, e.g. "info@yourdomain.com"
 *   NEXT_PUBLIC_SITE_URL    – Full site URL, e.g. "https://www.4wsinuajamii.org"
 *
 * Design principles enforced here:
 *  - Single sender identity: 4W'S INUA JAMII FOUNDATION across every template
 *  - Member emails vs admin emails are clearly separated
 *  - Email failure never breaks membership/auth operations (fire-and-forget pattern)
 *  - All templates are centralised in this one file
 */

// ---------------------------------------------------------------------------
// Constants – single source of truth for branding
// ---------------------------------------------------------------------------
const ORG_NAME    = "4W'S Inua Jamii Foundation"
const ORG_TAGLINE = 'Wisdom · Wellness · Wealth · Worth'
const ORG_COUNTRY = 'Kenya'
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.4wsinuajamii.org'

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------
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
  const apiKey  = process.env.RESEND_API_KEY
  const from    = process.env.EMAIL_FROM    ?? `${ORG_NAME} <noreply@4wsinuajamii.org>`
  const replyTo = opts.replyTo ?? process.env.EMAIL_REPLY_TO ?? undefined

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
        to:       Array.isArray(opts.to) ? opts.to : [opts.to],
        subject:  opts.subject,
        html:     opts.html,
        reply_to: replyTo,
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
// Shared layout wrapper — every template uses this for consistent branding
// ---------------------------------------------------------------------------
function emailLayout({
  headerTitle,
  headerSubtitle,
  headerColor = '#1E3A8A',
  body,
}: {
  headerTitle: string
  headerSubtitle?: string
  headerColor?: string
  body: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${headerTitle} — ${ORG_NAME}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
  <div style="max-width:580px;margin:0 auto;">

    <!-- Header -->
    <div style="background:${headerColor};border-radius:12px 12px 0 0;padding:32px 40px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">${ORG_NAME}</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;line-height:1.3;">${headerTitle}</h1>
      ${headerSubtitle ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${headerSubtitle}</p>` : ''}
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:36px 40px;">
      ${body}
    </div>

    <!-- Footer -->
    <div style="background:#e2e8f0;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;">${ORG_NAME} &middot; ${ORG_COUNTRY}</p>
      <p style="margin:0;color:#94a3b8;font-size:11px;">${ORG_TAGLINE}</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">This email was sent by ${ORG_NAME}. Please do not reply directly to this message.</p>
    </div>

  </div>
</body>
</html>`
}

// Reusable button block
function emailButton(label: string, href: string, color = '#1E3A8A') {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:13px 28px;background:${color};color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em;">${label}</a>`
}

// Reusable info row for detail tables
function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:40%;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;text-align:right;">${value}</td>
  </tr>`
}

// ---------------------------------------------------------------------------
// 1. APPLICATION RECEIVED  (sent to member immediately after signup)
//    Purpose: confirm we received their membership application.
//    Separate from Supabase's own "confirm your email" message.
// ---------------------------------------------------------------------------
export function applicationReceivedHtml({ name, tier }: { name: string; tier: string }) {
  const tierLabel: Record<string, string> = { basic: 'Classic', active: 'Premium', champion: 'Gold' }
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${name}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for registering with <strong>${ORG_NAME}</strong>.
      We have received your membership application and it is now under review by our team.
    </p>

    <div style="background:#f0f9ff;border-left:4px solid #1E3A8A;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1E3A8A;text-transform:uppercase;letter-spacing:0.08em;">Your Application Summary</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Name', name)}
        ${infoRow('Membership Tier', tierLabel[tier] ?? tier)}
        ${infoRow('Status', 'Pending Review')}
      </table>
    </div>

    <p style="color:#334155;font-size:15px;line-height:1.6;"><strong>What happens next?</strong></p>
    <ol style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;">
      <li>Please confirm your email address using the separate confirmation link sent by our system.</li>
      <li>Our team will review your application and verify your details.</li>
      <li>Once approved, you will receive a membership approval email with access to your digital membership card.</li>
    </ol>

    <p style="color:#64748b;font-size:13px;margin-top:24px;">
      If you have any questions in the meantime, please contact us at
      <a href="mailto:info@4wsinuajamii.org" style="color:#1E3A8A;">info@4wsinuajamii.org</a>.
    </p>
  `
  return emailLayout({
    headerTitle:    'Application Received',
    headerSubtitle: 'Your membership application is under review.',
    body,
  })
}

// ---------------------------------------------------------------------------
// 2. MEMBERSHIP APPROVED  (sent to member when admin approves them)
// ---------------------------------------------------------------------------
export function membershipApprovedHtml({
  name,
  tier,
  memberId,
  validUntil,
}: {
  name: string
  tier: string
  memberId: string
  validUntil: string
}) {
  const tierLabel: Record<string, string> = { basic: 'Classic', active: 'Premium', champion: 'Gold' }
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${name}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      We are pleased to inform you that your membership application to
      <strong>${ORG_NAME}</strong> has been <strong style="color:#16a34a;">approved</strong>.
      Welcome to the 4W&rsquo;S family!
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Membership Details</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Member Name', name)}
        ${infoRow('Membership Tier', tierLabel[tier] ?? tier)}
        ${infoRow('Member ID', memberId)}
        ${infoRow('Valid Until', validUntil)}
        ${infoRow('Status', 'Active ✓')}
      </table>
    </div>

    <p style="color:#334155;font-size:15px;line-height:1.6;">
      You now have full access to your member dashboard, digital membership card, events, and programs.
    </p>
    ${emailButton('Go to My Dashboard', `${SITE_URL}/dashboard`, '#16a34a')}
    ${emailButton('View My Membership Card', `${SITE_URL}/dashboard/membership-card`, '#1E3A8A')}

    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      Your digital membership card includes a QR code that can be used for verification at all
      ${ORG_NAME} events and programs. You can download or print it from your dashboard.
    </p>
  `
  return emailLayout({
    headerTitle:    'Membership Approved!',
    headerSubtitle: `Welcome to ${ORG_NAME}.`,
    headerColor:    '#16a34a',
    body,
  })
}

// ---------------------------------------------------------------------------
// 3. MEMBERSHIP REJECTED  (sent to member when admin rejects their application)
// ---------------------------------------------------------------------------
export function membershipRejectedHtml({ name, reason }: { name: string; reason?: string }) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${name}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for your interest in joining <strong>${ORG_NAME}</strong>.
      After reviewing your application, we are unfortunately unable to approve your membership at this time.
    </p>
    ${reason ? `
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ea580c;">Reason</p>
      <p style="margin:0;color:#334155;font-size:14px;">${reason}</p>
    </div>` : ''}
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      If you believe this decision was made in error, or if you would like more information,
      please contact us and we will be happy to assist you.
    </p>
    ${emailButton('Contact Us', `${SITE_URL}/contact`, '#1E3A8A')}

    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      You are welcome to reapply in the future. We appreciate your interest in supporting our mission.
    </p>
  `
  return emailLayout({
    headerTitle:    'Membership Application Update',
    headerSubtitle: 'An update regarding your application.',
    headerColor:    '#64748b',
    body,
  })
}

// ---------------------------------------------------------------------------
// 4. MEMBERSHIP PENDING (sent when status is set back to pending, e.g. more info needed)
// ---------------------------------------------------------------------------
export function membershipPendingHtml({ name, note }: { name: string; note?: string }) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${name}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      We are following up regarding your membership application with <strong>${ORG_NAME}</strong>.
      Your application is currently on hold pending further review.
    </p>
    ${note ? `
    <div style="background:#fefce8;border-left:4px solid #eab308;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ca8a04;">Additional Information Required</p>
      <p style="margin:0;color:#334155;font-size:14px;">${note}</p>
    </div>` : ''}
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Please contact us so we can complete the review of your application.
    </p>
    ${emailButton('Contact Us', `${SITE_URL}/contact`, '#1E3A8A')}
  `
  return emailLayout({
    headerTitle:    'Action Required: Membership Application',
    headerSubtitle: 'Your application requires attention.',
    headerColor:    '#b45309',
    body,
  })
}

// ---------------------------------------------------------------------------
// 5. ADMIN — NEW MEMBER APPLICATION NOTIFICATION
//    Sent to admin(s) when a new member registers.
// ---------------------------------------------------------------------------
export function adminNewMemberHtml({
  memberName,
  memberEmail,
  tier,
  phone,
}: {
  memberName: string
  memberEmail: string
  tier: string
  phone?: string | null
}) {
  const tierLabel: Record<string, string> = { basic: 'Classic', active: 'Premium', champion: 'Gold' }
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">A new member has registered and is awaiting approval.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Name', memberName)}
        ${infoRow('Email', memberEmail)}
        ${infoRow('Phone', phone ?? 'Not provided')}
        ${infoRow('Applied Tier', tierLabel[tier] ?? tier)}
        ${infoRow('Status', 'Pending Approval')}
      </table>
    </div>

    ${emailButton('Review Application in Admin Panel', `${SITE_URL}/admin/members`, '#1E3A8A')}

    <p style="color:#64748b;font-size:13px;margin-top:24px;">
      This is an automated notification from the ${ORG_NAME} membership system.
    </p>
  `
  return emailLayout({
    headerTitle:    'New Member Application',
    headerSubtitle: `${memberName} has registered and is awaiting your approval.`,
    headerColor:    '#1E3A8A',
    body,
  })
}

// ---------------------------------------------------------------------------
// 6. DONATION RECEIPT  (sent to donor after successful donation)
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
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${name}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for your generous donation to <strong>${ORG_NAME}</strong>.
      Your contribution directly supports our programs and makes a real difference in our community.
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Donation Receipt</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Amount', `KES ${amount.toLocaleString()}`)}
        ${infoRow('Reference', reference)}
        ${infoRow('Date', date)}
        ${infoRow('Organisation', ORG_NAME)}
      </table>
    </div>

    <p style="color:#64748b;font-size:13px;margin-top:24px;">
      This email serves as your official donation receipt. Please retain it for your records.
    </p>
    ${emailButton('Visit Our Website', SITE_URL, '#16a34a')}
  `
  return emailLayout({
    headerTitle:    'Thank You for Your Donation',
    headerSubtitle: 'Your generosity changes lives.',
    headerColor:    '#16a34a',
    body,
  })
}

// ---------------------------------------------------------------------------
// 7. WELCOME EMAIL  (legacy / CMS-customisable fallback — kept for compatibility)
//    NOTE: For new flows use applicationReceivedHtml + membershipApprovedHtml instead.
// ---------------------------------------------------------------------------
export function welcomeEmailHtml({ name }: { name: string }) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hi <strong>${name}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Welcome to <strong>${ORG_NAME}</strong>! We are thrilled to have you join our community
      of change-makers across Kenya.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Your membership gives you access to events, programs, your digital membership card,
      and a growing network committed to wisdom, wellness, wealth, and worth.
    </p>
    ${emailButton('Go to My Dashboard', `${SITE_URL}/dashboard`, '#1E3A8A')}
    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      If you have any questions, please contact us at
      <a href="mailto:info@4wsinuajamii.org" style="color:#1E3A8A;">info@4wsinuajamii.org</a>.
    </p>
  `
  return emailLayout({
    headerTitle:    `Welcome to ${ORG_NAME}`,
    headerSubtitle: ORG_TAGLINE,
    body,
  })
}
