import { createAdminClient } from '@/lib/supabase/admin-client'
import { formatMembershipId } from '@/lib/membership'
import {
  sendEmail,
  sendEmailBatch,
  membershipApprovedHtml,
  membershipRejectedHtml,
  membershipPendingHtml,
  membershipRenewedHtml,
  type SendEmailOptions,
  type SendEmailResult,
} from '@/lib/email'
import { getEmailSettings } from '@/lib/email-settings'
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

/** Emails are stored in auth.users, which is not reachable through PostgREST. */
async function getMemberEmails(admin: AdminClient, profileIds: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>()

  if (profileIds.length === 1) {
    const { data } = await admin.auth.admin.getUserById(profileIds[0])
    if (data?.user?.email) emails.set(profileIds[0], data.user.email)
    return emails
  }

  const wanted = new Set(profileIds)
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users.length) break
    for (const user of data.users) {
      if (user.email && wanted.has(user.id)) emails.set(user.id, user.email)
    }
    if (emails.size === wanted.size || data.users.length < 1000) break
  }

  return emails
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

  return (profiles ?? []).flatMap((profile) => {
    const to = emails.get(profile.id as string)
    if (!to) return []
    const term = termByUser.get(profile.id as string)
    return [{
      to,
      subject: SUBJECTS[status],
      from:    settings.fromHeader,
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

    const result = await sendEmail({
      to,
      subject: `Your Membership Has Been Renewed — 4W'S Inua Jamii Foundation`,
      from:    settings.fromHeader,
      html:    membershipRenewedHtml({
        name:       profile?.full_name ?? 'Member',
        tier:       profile?.tier ?? 'basic',
        memberId:   term ? formatMembershipId(term.id) : null,
        validUntil: term?.valid_until ? formatDate(term.valid_until) : null,
      }),
    })

    if (!result.success) console.error(`[email] renewal email failed for ${profileId}:`, result.error)
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
