import { createAdminClient } from '@/lib/supabase/admin-client'
import { formatMembershipId } from '@/lib/membership'
import {
  sendEmail,
  sendEmailBatch,
  membershipApprovedHtml,
  membershipRejectedHtml,
  membershipPendingHtml,
  membershipRenewedHtml,
  escapeHtml,
  emailLayout,
  emailButton,
  SITE_URL,
  ORG_NAME,
  type SendEmailOptions,
  type SendEmailResult,
} from '@/lib/email'
import { getEmailSettings, senderFor } from '@/lib/email-settings'
import { getMemberEmails } from '@/lib/notifications/member-emails'
import type { MembershipStatus } from '@/types'

const SUBJECTS: Record<MembershipStatus, string> = {
  approved: `Your Membership Has Been Approved — 4W'S Inua Jamii Foundation`,
  rejected: `Membership Application Update — 4W'S Inua Jamii Foundation`,
  pending:  `Action Required: Membership Application — 4W'S Inua Jamii Foundation`,
}

type AdminClient = ReturnType<typeof createAdminClient>

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusHtml(
  status: MembershipStatus,
  member: { name: string; tier: string; termId?: string | null; validUntil?: string | null },
  note?: string,
) {
  if (status === 'approved') {
    return membershipApprovedHtml({
      name:       member.name,
      tier:       member.tier,
      memberId:   member.termId ? formatMembershipId(member.termId) : null,
      validUntil: member.validUntil ? formatDate(member.validUntil) : null,
    })
  }
  return status === 'rejected'
    ? membershipRejectedHtml({ name: member.name, reason: note })
    : membershipPendingHtml({ name: member.name, note })
}

async function buildStatusEmails(
  admin: AdminClient,
  profileIds: string[],
  status: MembershipStatus,
  note?: string,
): Promise<SendEmailOptions[]> {
  const [{ data: profiles }, { data: terms }, emails, settings] = await Promise.all([
    admin.from('profiles').select('id, full_name, tier').in('id', profileIds),
    admin.from('membership_terms').select('id, user_id, valid_until').in('user_id', profileIds).eq('is_active', true),
    getMemberEmails(admin, profileIds),
    getEmailSettings(admin),
  ])

  const termByUser = new Map((terms ?? []).map((t) => [t.user_id as string, t]))

  // Member-facing membership communication → sent from the membership@ role
  // (member relations), reply-to membership@ so the member can ask questions.
  const membership = senderFor(settings, 'membership')

  return (profiles ?? []).flatMap((profile) => {
    const to = emails.get(profile.id as string)
    if (!to) return []
    const term = termByUser.get(profile.id as string)
    return [{
      to,
      subject: SUBJECTS[status],
      from:    membership.from,
      replyTo: membership.replyTo,
      html:    statusHtml(status, {
        name:       (profile.full_name as string) ?? 'Member',
        tier:       (profile.tier as string) ?? 'basic',
        termId:     term?.id as string | undefined,
        validUntil: term?.valid_until as string | undefined,
      }, note),
    }]
  })
}

/**
 * Sends the member-facing email for a membership status change.
 *
 * Never throws: a missing service-role key or a Resend outage must not fail the
 * admin action that triggered it. Callers await it so the send is not torn down
 * with the serverless invocation.
 */
export async function sendMembershipStatusEmail({
  profileId,
  status,
  note,
}: {
  profileId: string
  status: MembershipStatus
  note?: string
}): Promise<SendEmailResult> {
  try {
    const admin = createAdminClient()
    const [message] = await buildStatusEmails(admin, [profileId], status, note)
    if (!message) return { success: false, error: 'Member has no email address' }

    const result = await sendEmail(message)
    if (!result.success) console.error(`[email] ${status} email failed for ${profileId}:`, result.error)

    // Notify admins about the membership status change.
    // Admin alert → sent from no-reply@ (automation) to admin@.
    const { data: profile } = await admin.from('profiles').select('full_name, email').eq('id', profileId).single()
    const settings = await getEmailSettings(admin)
    const noReply = senderFor(settings, 'no-reply')
    if (settings.adminEmails.length && profile) {
      await sendEmail({
        to: settings.adminEmails,
        from: noReply.from,
        subject: `[Admin] Membership ${status}: ${profile.full_name ?? 'Member'}`,
        html: adminMembershipAlertHtml({
          type: `Membership ${status}`,
          name: profile.full_name ?? 'Member',
          status,
          note,
          profileId,
        }),
      }).catch(() => {})
    }

    return result
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[email] ${status} email error for ${profileId}:`, error)
    return { success: false, error }
  }
}

/** Sent when an admin renews an existing member's term. */
export async function sendMembershipRenewedEmail(profileId: string): Promise<SendEmailResult> {
  try {
    const admin = createAdminClient()

    const [{ data: profile }, emails, { data: term }, settings] = await Promise.all([
      admin.from('profiles').select('full_name, tier').eq('id', profileId).single(),
      getMemberEmails(admin, [profileId]),
      admin
        .from('membership_terms')
        .select('id, valid_until')
        .eq('user_id', profileId)
        .eq('is_active', true)
        .maybeSingle(),
      getEmailSettings(admin),
    ])

    const to = emails.get(profileId)
    if (!to) return { success: false, error: 'Member has no email address' }

    // Member-facing renewal confirmation → sent from membership@ (member relations).
    const membership = senderFor(settings, 'membership')
    const result = await sendEmail({
      to,
      subject: `Your Membership Has Been Renewed — 4W'S Inua Jamii Foundation`,
      from:    membership.from,
      replyTo: membership.replyTo,
      html:    membershipRenewedHtml({
        name:       profile?.full_name ?? 'Member',
        tier:       profile?.tier ?? 'basic',
        memberId:   term ? formatMembershipId(term.id) : null,
        validUntil: term?.valid_until ? formatDate(term.valid_until) : null,
      }),
    })

    if (!result.success) console.error(`[email] renewal email failed for ${profileId}:`, result.error)

    // Notify admins about the renewal → sent from no-reply@ (automation) to admin@.
    const noReply = senderFor(settings, 'no-reply')
    if (settings.adminEmails.length && profile) {
      await sendEmail({
        to: settings.adminEmails,
        from: noReply.from,
        subject: `[Admin] Membership Renewed: ${profile.full_name ?? 'Member'}`,
        html: adminMembershipAlertHtml({
          type: 'Membership Renewed',
          name: profile.full_name ?? 'Member',
          status: 'approved',
          note: `Membership renewed. Valid until: ${term?.valid_until ? formatDate(term.valid_until) : 'N/A'}`,
          profileId,
        }),
      }).catch(() => {})
    }

    return result
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[email] renewal email error for ${profileId}:`, error)
    return { success: false, error }
  }
}

/** Batched equivalent for bulk admin actions — one Resend request per 100 members. */
export async function sendMembershipStatusEmails({
  profileIds,
  status,
  note,
}: {
  profileIds: string[]
  status: MembershipStatus
  note?: string
}): Promise<{ sent: number; failed: number }> {
  if (!profileIds.length) return { sent: 0, failed: 0 }

  try {
    const admin = createAdminClient()
    const messages = await buildStatusEmails(admin, profileIds, status, note)
    const results = await sendEmailBatch(messages)
    const sent = results.filter((r) => r.success).length
    return { sent, failed: profileIds.length - sent }
  } catch (err) {
    console.error(`[email] bulk ${status} email error:`, err instanceof Error ? err.message : err)
    return { sent: 0, failed: profileIds.length }
  }
}

// ---------------------------------------------------------------------------
// Admin membership alert email template
// ---------------------------------------------------------------------------
function adminMembershipAlertHtml(opts: {
  type: string
  name: string
  status: string
  note?: string
  profileId: string
}) {
  const statusColor = opts.status === 'approved' ? '#16a34a' : opts.status === 'rejected' ? '#dc2626' : '#f59e0b'
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hello Admin,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      A membership status update has been processed:
    </p>
    <div style="background:#f8fafc;border-left:4px solid ${statusColor};border-radius:6px;padding:16px 20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Action:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.type)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Member:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.name)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Status:</td><td style="padding:4px 0;font-size:14px;color:${statusColor};font-weight:700;">${escapeHtml(opts.status)}</td></tr>
        ${opts.note ? `<tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Note:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.note)}</td></tr>` : ''}
      </table>
    </div>
    ${emailButton('View Member', `${SITE_URL}/members/${opts.profileId}`, '#1E3A8A')}
    <p style="color:#64748b;font-size:13px;margin-top:20px;">
      This is an automated notification from the ${ORG_NAME} membership system.
    </p>
  `
  return emailLayout({
    headerTitle:    opts.type,
    headerSubtitle: 'Admin Notification',
    headerColor:    statusColor,
    body,
  })
}
