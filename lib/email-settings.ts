import type { SupabaseClient } from '@supabase/supabase-js'

export interface EmailSettings {
  /** RFC 5322 sender built from the CMS values, or undefined to fall back to EMAIL_FROM. */
  fromHeader?: string
  /** Recipients of admin notifications — `admin_notify_email` accepts a comma-separated list. */
  adminEmails: string[]
  /** Whether the "Application Received" email is sent on signup. */
  applicationEmailEnabled: boolean
  /** Whether admins are emailed about new member applications. */
  notifyAdminOnNewMember: boolean
  /** Optional CMS-authored intro for the "Application Received" email. */
  applicationEmailBody?: string
}

const KEYS = [
  'from_email',
  'from_name',
  'admin_notify_email',
  'welcome_email_enabled',
  'welcome_email_body',
  'admin_notify_new_member',
] as const

/**
 * Reads the CMS-configured email settings. Any failure degrades to the
 * environment/default configuration rather than blocking the caller.
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

  const fromEmail = values.from_email?.trim()
  const fromName  = values.from_name?.trim()

  return {
    fromHeader: fromEmail
      ? (fromName ? `${fromName.replace(/[<>"\r\n]/g, '')} <${fromEmail}>` : fromEmail)
      : undefined,
    adminEmails: (values.admin_notify_email ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean),
    applicationEmailEnabled: values.welcome_email_enabled !== 'false',
    notifyAdminOnNewMember:  values.admin_notify_new_member !== 'false',
    applicationEmailBody:    values.welcome_email_body?.trim() || undefined,
  }
}
