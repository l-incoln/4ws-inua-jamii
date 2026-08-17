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
 *  - Email failure never breaks membership/auth operations (callers inspect the
 *    returned SendEmailResult; sendEmail itself never throws)
 *  - Every value interpolated into a template is HTML-escaped
 *  - All templates are centralised in this one file
 */

import { TIER_LABELS, type MembershipTier } from '@/types'

// ---------------------------------------------------------------------------
// Constants – single source of truth for branding across every email
// ---------------------------------------------------------------------------
export const ORG_NAME    = "4W'S Inua Jamii Foundation"
export const ORG_TAGLINE = 'Wisdom · Wellness · Wealth · Worth'
const ORG_COUNTRY = 'Kenya'
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.4wsinuajamii.org'

// Tier display labels – keep in sync with types/index.ts
export const TIER_DISPLAY: Record<string, string> = {
  basic:    'Classic',
  active:   'Premium',
  champion: 'Gold',
}

// ---------------------------------------------------------------------------
// Escaping helpers – member-supplied values reach both member and admin inboxes
// ---------------------------------------------------------------------------
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c])
}

/** Escapes and converts newlines to <br/> for multi-line free text. */
function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br/>')
}

/** Header injection guard – subjects must be a single line. */
function sanitiseSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ').trim()
}

/**
 * Subject lines are not HTML, so escaping would show entities to the reader.
 * Drop any markup instead, keeping a member-supplied name readable.
 */
export function plainSubjectText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
}

function tierLabel(tier: string): string {
  return TIER_LABELS[tier as MembershipTier] ?? tier
}

/** Crude but adequate plain-text alternative — improves deliverability. */
function htmlToText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/(p|div|tr|h1|h2|h3|li|ol|ul|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&rsquo;/g, '’')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map((l) => l.trim()).join('\n')
    .trim()
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------
export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  /** Overrides EMAIL_FROM, e.g. the sender identity configured in the CMS. */
  from?: string
  /** Optional template name for audit logging (e.g. "donation_receipt"). */
  template?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey  = process.env.RESEND_API_KEY
  const from    = opts.from ?? process.env.EMAIL_FROM ?? `${ORG_NAME} <noreply@4wsinuajamii.org>`
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
        subject:  sanitiseSubject(opts.subject),
        html:     opts.html,
        text:     htmlToText(opts.html),
        reply_to: replyTo,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[email] Resend error', data)
      logEmail(opts, 'failed', data.message ?? 'Send failed')
      return { success: false, error: data.message ?? 'Send failed' }
    }

    logEmail(opts, 'sent')
    return { success: true, id: data.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[email]', msg)
    logEmail(opts, 'failed', msg)
    return { success: false, error: msg }
  }
}

/**
 * Best-effort email logging — never throws, never blocks.
 * Stores a record in the email_logs table for audit/admin review.
 */
async function logEmail(opts: SendEmailOptions, status: string, error?: string) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin-client')
    const supabase = createAdminClient()
    const recipients = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to
    await supabase.from('email_logs').insert({
      recipient: recipients,
      subject:   opts.subject,
      template:  opts.template ?? null,
      status,
      error:     error ?? null,
    })
  } catch {
    // Logging is best-effort — never let it break email sending
  }
}

/**
 * Sends up to 100 messages per Resend batch request — used by bulk admin
 * actions so they stay inside Resend's request rate limit.
 */
export async function sendEmailBatch(messages: SendEmailOptions[]): Promise<SendEmailResult[]> {
  const apiKey = process.env.RESEND_API_KEY
  if (!messages.length) return []

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — batch skipped')
    return messages.map(() => ({ success: false, error: 'Email not configured' }))
  }

  const results: SendEmailResult[] = []

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100)
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk.map((m) => ({
          from:     m.from ?? process.env.EMAIL_FROM ?? `${ORG_NAME} <noreply@4wsinuajamii.org>`,
          to:       Array.isArray(m.to) ? m.to : [m.to],
          subject:  sanitiseSubject(m.subject),
          html:     m.html,
          text:     htmlToText(m.html),
          reply_to: m.replyTo ?? process.env.EMAIL_REPLY_TO ?? undefined,
        }))),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[email] Resend batch error', data)
        const error = data.message ?? 'Batch send failed'
        results.push(...chunk.map(() => ({ success: false, error })))
        continue
      }

      const sent: Array<{ id?: string }> = data.data ?? []
      results.push(...chunk.map((_, idx) => ({ success: true, id: sent[idx]?.id })))
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      console.error('[email] batch', error)
      results.push(...chunk.map(() => ({ success: false, error })))
    }
  }

  return results
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
      <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
        <a href="${SITE_URL}/unsubscribe" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
        &nbsp;&middot;&nbsp;
        <a href="${SITE_URL}/privacy" style="color:#64748b;text-decoration:underline;">Privacy Policy</a>
      </p>
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
export function applicationReceivedHtml({
  name,
  tier,
  customMessage,
  requiresEmailConfirmation = true,
}: {
  name: string
  tier: string
  /** Optional CMS-authored intro (site_settings.welcome_email_body). */
  customMessage?: string
  requiresEmailConfirmation?: boolean
}) {
  const intro = customMessage
    ? `<p style="color:#334155;font-size:15px;line-height:1.6;">${escapeMultiline(customMessage)}</p>`
    : `<p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for registering with <strong>${ORG_NAME}</strong>.
      We have received your membership application and it is now under review by our team.
    </p>`
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    ${intro}

    <div style="background:#f0f9ff;border-left:4px solid #1E3A8A;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1E3A8A;text-transform:uppercase;letter-spacing:0.08em;">Your Application Summary</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Name', escapeHtml(name))}
        ${infoRow('Membership Tier', escapeHtml(tierLabel(tier)))}
        ${infoRow('Status', 'Pending Review')}
      </table>
    </div>

    <p style="color:#334155;font-size:15px;line-height:1.6;"><strong>What happens next?</strong></p>
    <ol style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;">
      ${requiresEmailConfirmation ? '<li>Please confirm your email address using the separate confirmation link sent by our system.</li>' : ''}
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
  /** Verification ID printed on the membership card, when a term exists. */
  memberId?: string | null
  /** Formatted expiry date, when a term exists. */
  validUntil?: string | null
}) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      We are pleased to inform you that your membership application to
      <strong>${ORG_NAME}</strong> has been <strong style="color:#16a34a;">approved</strong>.
      Welcome to the 4W&rsquo;S family!
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Membership Details</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Member Name', escapeHtml(name))}
        ${infoRow('Membership Tier', escapeHtml(tierLabel(tier)))}
        ${memberId ? infoRow('Member ID', escapeHtml(memberId)) : ''}
        ${validUntil ? infoRow('Valid Until', escapeHtml(validUntil)) : ''}
        ${infoRow('Status', 'Active ✓')}
      </table>
    </div>

    <p style="color:#334155;font-size:15px;line-height:1.6;">
      You now have full access to your member dashboard, digital membership card, events, and programs.
    </p>
    ${emailButton('View My Membership Card', `${SITE_URL}/dashboard/membership-card`, '#16a34a')}

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
// 2b. MEMBERSHIP RENEWED  (sent to member when an admin renews their term)
// ---------------------------------------------------------------------------
export function membershipRenewedHtml({
  name,
  tier,
  memberId,
  validUntil,
}: {
  name: string
  tier: string
  memberId?: string | null
  validUntil?: string | null
}) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Your membership with <strong>${ORG_NAME}</strong> has been renewed. Thank you for
      continuing to walk this journey with us.
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Renewed Membership</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Member Name', escapeHtml(name))}
        ${infoRow('Membership Tier', escapeHtml(tierLabel(tier)))}
        ${memberId ? infoRow('Member ID', escapeHtml(memberId)) : ''}
        ${validUntil ? infoRow('Valid Until', escapeHtml(validUntil)) : ''}
      </table>
    </div>

    <p style="color:#64748b;font-size:13px;">
      Your membership card has been updated with the new dates and QR code.
    </p>
    ${emailButton('View My Membership Card', `${SITE_URL}/dashboard/membership-card`, '#16a34a')}
  `
  return emailLayout({
    headerTitle:    'Membership Renewed',
    headerSubtitle: `Your ${ORG_NAME} membership has been extended.`,
    headerColor:    '#16a34a',
    body,
  })
}

// ---------------------------------------------------------------------------
// 3. MEMBERSHIP REJECTED  (sent to member when admin rejects their application)
// ---------------------------------------------------------------------------
export function membershipRejectedHtml({ name, reason }: { name: string; reason?: string }) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for your interest in joining <strong>${ORG_NAME}</strong>.
      After reviewing your application, we are unfortunately unable to approve your membership at this time.
    </p>
    ${reason ? `
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ea580c;">Reason</p>
      <p style="margin:0;color:#334155;font-size:14px;">${escapeMultiline(reason)}</p>
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
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      We are following up regarding your membership application with <strong>${ORG_NAME}</strong>.
      Your application is currently on hold pending further review.
    </p>
    ${note ? `
    <div style="background:#fefce8;border-left:4px solid #eab308;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ca8a04;">Additional Information Required</p>
      <p style="margin:0;color:#334155;font-size:14px;">${escapeMultiline(note)}</p>
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
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">A new member has registered and is awaiting approval.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Name', escapeHtml(memberName))}
        ${infoRow('Email', escapeHtml(memberEmail))}
        ${infoRow('Phone', escapeHtml(phone ?? 'Not provided'))}
        ${infoRow('Applied Tier', escapeHtml(tierLabel(tier)))}
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
    headerSubtitle: `${escapeHtml(memberName)} has registered and is awaiting your approval.`,
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
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for your generous donation to <strong>${ORG_NAME}</strong>.
      Your contribution directly supports our programs and makes a real difference in our community.
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Donation Receipt</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Amount', `KES ${amount.toLocaleString()}`)}
        ${infoRow('Reference', escapeHtml(reference))}
        ${infoRow('Date', escapeHtml(date))}
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
// 5b. MEMBERSHIP PAYMENT RECEIPT — sent when M-Pesa confirms a membership fee
// ---------------------------------------------------------------------------
export function membershipReceiptHtml({
  name,
  tier,
  amount,
  reference,
  date,
}: {
  name: string
  tier: string
  amount: number
  reference: string
  date: string
}) {
  const tierLabel =
    tier === 'champion' ? 'Gold Member'
    : tier === 'active' ? 'Premium Member'
    : 'Classic Member'

  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      We have received your membership fee payment for the <strong>${escapeHtml(tierLabel)}</strong> tier.
      Your payment has been confirmed and an administrator will activate your membership shortly.
    </p>

    <div style="background:#eff6ff;border-left:4px solid #1E3A8A;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1E3A8A;text-transform:uppercase;letter-spacing:0.08em;">Payment Receipt</p>
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Membership Tier', escapeHtml(tierLabel))}
        ${infoRow('Amount', `KES ${amount.toLocaleString()}`)}
        ${infoRow('M-Pesa Reference', escapeHtml(reference))}
        ${infoRow('Date', escapeHtml(date))}
        ${infoRow('Organisation', ORG_NAME)}
      </table>
    </div>

    <p style="color:#64748b;font-size:13px;margin-top:24px;">
      This email serves as your payment receipt. Please retain it for your records.
      Once your membership is activated, you will receive a confirmation email and
      can access your digital membership card from your dashboard.
    </p>
    ${emailButton('Go to My Dashboard', `${SITE_URL}/dashboard`, '#1E3A8A')}
  `
  return emailLayout({
    headerTitle:    'Membership Payment Confirmed',
    headerSubtitle: 'Thank you for joining our community.',
    headerColor:    '#1E3A8A',
    body,
  })
}

// ---------------------------------------------------------------------------
// 6b. BIRTHDAY — TEAM REMINDER (sent one day before, to the membership desk)
//     Internal only: contains the day/month so a poster can be prepared, and
//     flags whether the member consented to a public celebration.
// ---------------------------------------------------------------------------
export function birthdayTeamReminderHtml({
  celebrationDate,
  members,
}: {
  /** Formatted date of the birthday itself (i.e. tomorrow). */
  celebrationDate: string
  members: Array<{ name: string; tier: string; isPublic: boolean }>
}) {
  const rows = members.map((m) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;">${escapeHtml(m.name)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;text-align:center;">${escapeHtml(tierLabel(m.tier))}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;color:${m.isPublic ? '#16a34a' : '#b45309'};font-weight:600;">
        ${m.isPublic ? 'Public celebration OK' : 'Private — do not post'}
      </td>
    </tr>`).join('')

  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">
      ${members.length === 1 ? 'One member celebrates' : `${members.length} members celebrate`} a birthday
      <strong>tomorrow, ${escapeHtml(celebrationDate)}</strong>. Time to prepare the poster and message.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <th style="text-align:left;padding-bottom:8px;color:#64748b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Member</th>
          <th style="text-align:center;padding-bottom:8px;color:#64748b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Tier</th>
          <th style="text-align:right;padding-bottom:8px;color:#64748b;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Privacy</th>
        </tr>
        ${rows}
      </table>
    </div>

    <p style="color:#334155;font-size:14px;line-height:1.6;">
      Members marked <strong>Private</strong> have not consented to a public celebration — greet them
      directly, but do not post them on social media or the community feed.
    </p>

    ${emailButton('Open Admin Panel', `${SITE_URL}/admin/members`, '#1E3A8A')}

    <p style="color:#64748b;font-size:13px;margin-top:24px;">
      This is an automated reminder from the ${ORG_NAME} membership system.
    </p>
  `
  return emailLayout({
    headerTitle:    'Birthday Tomorrow',
    headerSubtitle: `Prepare a celebration for ${escapeHtml(celebrationDate)}.`,
    headerColor:    '#b45309',
    body,
  })
}

// ---------------------------------------------------------------------------
// 6c. BIRTHDAY — MEMBER GREETING (sent to the member on the day)
// ---------------------------------------------------------------------------
export function birthdayGreetingHtml({ name }: { name: string }) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Happy birthday from everyone at <strong>${ORG_NAME}</strong>! 🎉
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for the wisdom, wellness, wealth, and worth you bring to this community.
      We hope your day is full of joy, and we look forward to another year of building together.
    </p>
    ${emailButton('See Your Birthday Dashboard', `${SITE_URL}/dashboard`, '#db2777')}

    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      You can change your birthday and celebration preferences any time under
      Dashboard &rsaquo; Settings.
    </p>
  `
  return emailLayout({
    headerTitle:    `Happy Birthday, ${escapeHtml(name)}! 🎂`,
    headerSubtitle: 'With warm wishes from the whole 4W’S family.',
    headerColor:    '#db2777',
    body,
  })
}

// ---------------------------------------------------------------------------
// 7. WELCOME EMAIL  (legacy / CMS-customisable fallback — kept for compatibility)
//    NOTE: For new flows use applicationReceivedHtml + membershipApprovedHtml instead.
// ---------------------------------------------------------------------------
export function welcomeEmailHtml({ name }: { name: string }) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
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

// ---------------------------------------------------------------------------
// 8. MEMBERSHIP EXPIRY REMINDER — sent 7 days before membership expires
// ---------------------------------------------------------------------------
export function membershipExpiryReminderHtml({
  name,
  expiryDate,
  tier,
}: {
  name: string
  expiryDate: string
  tier: string
}) {
  const tierLabel =
    tier === 'champion' ? 'Gold'
    : tier === 'active' ? 'Premium'
    : 'Classic'

  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Dear <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      This is a friendly reminder that your <strong>${escapeHtml(tierLabel)}</strong> membership with
      <strong>${ORG_NAME}</strong> will expire on <strong>${escapeHtml(expiryDate)}</strong>.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      To continue enjoying all the benefits of membership — including event access, your digital
      membership card, and our community programs — please renew before the expiry date.
    </p>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#92400e;">
        <strong>Expiry Date:</strong> ${escapeHtml(expiryDate)}
      </p>
    </div>
    ${emailButton('View My Membership Card', `${SITE_URL}/dashboard/membership-card`, '#1E3A8A')}
    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      If you have any questions about renewal, please contact us at
      <a href="mailto:info@4wsinuajamii.org" style="color:#1E3A8A;">info@4wsinuajamii.org</a>.
    </p>
  `
  return emailLayout({
    headerTitle:    'Membership Expiring Soon',
    headerSubtitle: 'Renew to keep your benefits active.',
    headerColor:    '#f59e0b',
    body,
  })
}

// ---------------------------------------------------------------------------
// 9. COMMENT APPROVAL NOTIFICATION — sent to commenter when their comment is approved
// ---------------------------------------------------------------------------
export function commentApprovedHtml({
  name,
  postTitle,
  commentBody,
  postUrl,
}: {
  name: string
  postTitle: string
  commentBody: string
  postUrl: string
}) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Great news! Your comment on the blog post <strong>&ldquo;${escapeHtml(postTitle)}&rdquo;</strong> has been
      approved and is now visible to all readers.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Your Comment</p>
      <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(commentBody.slice(0, 200))}${commentBody.length > 200 ? '&hellip;' : ''}</p>
    </div>
    ${emailButton('Read the Blog Post', postUrl, '#16a34a')}
    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      Thank you for contributing to the conversation!
    </p>
  `
  return emailLayout({
    headerTitle:    'Your Comment Was Approved',
    headerSubtitle: 'Your voice matters to our community.',
    headerColor:    '#16a34a',
    body,
  })
}
