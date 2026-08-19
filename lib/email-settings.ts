import type { SupabaseClient } from '@supabase/supabase-js'
import { ORG_NAME } from '@/lib/email'

// ---------------------------------------------------------------------------
// Email roles — the four canonical inboxes that own all communication.
//
//   no-reply@     Automation     — sends receipts, confirmations, verification,
//                                  resets, automated notifications. Receives
//                                  nothing (no reply-to).
//   info@         Public         — receives general enquiries, partnerships,
//                                  media, community questions. Sends public/
//                                  general responses (e.g. newsletter).
//   membership@   Member relations — receives membership questions, member
//                                  issues, birthday reminders. Sends member
//                                  support, reminders, membership comms.
//   admin@        Administration  — receives payments, approvals, system
//                                  alerts, administrative matters. Sends
//                                  administrative responses.
//
// Each role address is CMS-configurable (site_settings) with the canonical
// address on 4wsinuajamii.org as the default.
// ---------------------------------------------------------------------------
export type EmailRole = 'no-reply' | 'info' | 'membership' | 'admin'

export const DEFAULT_ROLE_ADDRESSES: Record<EmailRole, string> = {
  'no-reply':    'no-reply@4wsinuajamii.org',
  'info':        'info@4wsinuajamii.org',
  'membership':  'membership@4wsinuajamii.org',
  'admin':       'admin@4wsinuajamii.org',
}

export interface RoleSender {
  /** The bare address, e.g. "membership@4wsinuajamii.org". */
  address: string
  /** RFC 5322 `from` header, e.g. "4W'S Inua Jamii Foundation <membership@4wsinuajamii.org>". */
  from: string
  /** Reply-to address for the role, or undefined for no-reply (receives nothing). */
  replyTo?: string
}

export type EmailRouting = Record<EmailRole, RoleSender>

export interface EmailSettings {
  /** Per-role sender identities (from + replyTo). */
  roles: EmailRouting
  /** Recipients of admin notifications — `email_role_admin` accepts a comma-separated list. */
  adminEmails: string[]
  /** Public contact address (info@ role) — used in templates and footers. */
  contactEmail: string
  /** Whether the "Application Received" email is sent on signup. */
  applicationEmailEnabled: boolean
  /** Whether admins are emailed about new member applications. */
  notifyAdminOnNewMember: boolean
  /** Optional CMS-authored intro for the "Application Received" email. */
  applicationEmailBody?: string
  /**
   * @deprecated Use `senderFor(settings, 'no-reply').from` instead. Kept so any
   * caller that has not been migrated still resolves to the no-reply sender.
   */
  fromHeader?: string
}

const KEYS = [
  'from_email',
  'from_name',
  'admin_notify_email',
  'welcome_email_enabled',
  'welcome_email_body',
  'admin_notify_new_member',
  'contact_email',
  'email_role_noreply',
  'email_role_info',
  'email_role_membership',
  'email_role_admin',
] as const

/** Builds a RFC 5322 `from` header from a display name and address. */
function buildFrom(name: string, address: string): string {
  const cleanName = name.replace(/[<>"\r\n]/g, '').trim()
  return cleanName ? `${cleanName} <${address}>` : address
}

/**
 * Returns the sender identity (`from` + `replyTo`) for a given role.
 * `no-reply` has no reply-to (it receives nothing); every other role replies
 * to its own address.
 */
export function senderFor(settings: EmailSettings, role: EmailRole): RoleSender {
  return settings.roles[role]
}

/**
 * Reads the CMS-configured email settings. Any failure degrades to the
 * canonical defaults rather than blocking the caller.
 */
export async function getEmailSettings(supabase: SupabaseClient): Promise<EmailSettings> {
  let values: Record<string, string> = {}

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', KEYS as unknown as string[])
    values = Object.fromEntries((data ?? []).map((r) => [r.key as string, (r.value as string) ?? '']))
  } catch (err) {
    console.error('[email] failed to read email settings:', err)
  }

  const fromName = values.from_name?.trim() || ORG_NAME

  // Resolve each role address: CMS role key → legacy override → canonical default.
  // `from_email` (legacy single-sender) overrides the no-reply role for backward compat.
  const roleAddress: Record<EmailRole, string> = {
    'no-reply':    (values.email_role_noreply?.trim()    || values.from_email?.trim()    || DEFAULT_ROLE_ADDRESSES['no-reply']).toLowerCase(),
    'info':        (values.email_role_info?.trim()        || DEFAULT_ROLE_ADDRESSES['info']).toLowerCase(),
    'membership':  (values.email_role_membership?.trim()  || DEFAULT_ROLE_ADDRESSES['membership']).toLowerCase(),
    'admin':       (values.email_role_admin?.trim()       || DEFAULT_ROLE_ADDRESSES['admin']).toLowerCase(),
  }

  const roles: EmailRouting = {
    'no-reply':    { address: roleAddress['no-reply'],    from: buildFrom(fromName, roleAddress['no-reply']) },
    'info':        { address: roleAddress['info'],        from: buildFrom(fromName, roleAddress['info']),        replyTo: roleAddress['info'] },
    'membership':  { address: roleAddress['membership'],  from: buildFrom(fromName, roleAddress['membership']),  replyTo: roleAddress['membership'] },
    'admin':       { address: roleAddress['admin'],       from: buildFrom(fromName, roleAddress['admin']),       replyTo: roleAddress['admin'] },
  }

  // Admin notification recipients: the admin role key accepts a comma-separated
  // list (multiple admins). Legacy `admin_notify_email` overrides when set.
  const adminList = (values.email_role_admin?.trim() || values.admin_notify_email?.trim() || DEFAULT_ROLE_ADDRESSES['admin'])
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .filter((e, i, arr) => arr.indexOf(e) === i)

  return {
    roles,
    adminEmails: adminList,
    contactEmail: roleAddress['info'],
    applicationEmailEnabled: values.welcome_email_enabled !== 'false',
    notifyAdminOnNewMember:  values.admin_notify_new_member !== 'false',
    applicationEmailBody:    values.welcome_email_body?.trim() || undefined,
    fromHeader:              roles['no-reply'].from,
  }
}
