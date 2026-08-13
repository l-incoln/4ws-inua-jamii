import { createAdminClient } from '@/lib/supabase/admin-client'
import { sendEmail, birthdayTeamReminderHtml, birthdayGreetingHtml } from '@/lib/email'
import { getEmailSettings } from '@/lib/email-settings'
import { getMemberEmails } from '@/lib/notifications/member-emails'
import {
  BIRTHDAY_TEAM_EMAIL,
  addDays,
  formatBirthdayDayMonth,
  isBirthdayOn,
  todayInZone,
} from '@/lib/birthdays'

type AdminClient = ReturnType<typeof createAdminClient>

interface BirthdayMember {
  userId: string
  name: string
  tier: string
  birthDate: string
  isPublic: boolean
  receiveGreetings: boolean
}

type PendingMember = BirthdayMember & { alreadyDone: boolean }

export interface BirthdayRunResult {
  today: string
  remindersSent: number
  greetingsSent: number
  skipped: number
  errors: string[]
}

/** Approved members with a stored birthday. Emails stay in auth.users. */
async function loadBirthdayMembers(admin: AdminClient): Promise<BirthdayMember[]> {
  const { data, error } = await admin
    .from('member_birthdays')
    .select('user_id, birth_date, is_public, receive_greetings, profiles!inner(full_name, tier, membership_status)')

  if (error) throw new Error(`Failed to load birthdays: ${error.message}`)

  type Row = {
    user_id: string
    birth_date: string
    is_public: boolean
    receive_greetings: boolean
    profiles: { full_name: string | null; tier: string | null; membership_status: string } |
              Array<{ full_name: string | null; tier: string | null; membership_status: string }>
  }

  return (data as Row[] ?? []).flatMap((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (!profile || profile.membership_status !== 'approved') return []
    return [{
      userId:           row.user_id,
      name:             profile.full_name ?? 'Member',
      tier:             profile.tier ?? 'basic',
      birthDate:        row.birth_date,
      isPublic:         row.is_public,
      receiveGreetings: row.receive_greetings,
    }]
  })
}

/** Members that already received `kind` for `occasionDate` — keeps re-runs safe. */
async function alreadyNotified(
  admin: AdminClient,
  kind: 'team_reminder' | 'member_greeting',
  occasionDate: string,
  userIds: string[],
): Promise<Set<string>> {
  if (!userIds.length) return new Set()
  const { data } = await admin
    .from('birthday_notifications')
    .select('user_id')
    .eq('kind', kind)
    .eq('occasion_date', occasionDate)
    .in('user_id', userIds)
  return new Set((data ?? []).map((r) => r.user_id as string))
}

async function recordNotified(
  admin: AdminClient,
  kind: 'team_reminder' | 'member_greeting',
  occasionDate: string,
  userIds: string[],
): Promise<void> {
  if (!userIds.length) return
  const { error } = await admin
    .from('birthday_notifications')
    .upsert(
      userIds.map((user_id) => ({ user_id, kind, occasion_date: occasionDate })),
      { onConflict: 'user_id,occasion_date,kind', ignoreDuplicates: true },
    )
  if (error) console.error('[birthdays] ledger write failed:', error.message)
}

/** Recipient of the internal "birthday tomorrow" reminder. */
async function getTeamRecipients(admin: AdminClient): Promise<string[]> {
  const { data } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'birthday_notify_email')
    .maybeSingle()

  const configured = (data?.value as string | undefined)?.split(',').map((e) => e.trim()).filter(Boolean)
  return configured?.length ? configured : [BIRTHDAY_TEAM_EMAIL]
}

/**
 * One day before: a single digest to the membership desk so the team can
 * prepare a poster/message. The digest states, per member, whether a public
 * celebration was consented to.
 */
async function sendTeamReminder(
  admin: AdminClient,
  members: PendingMember[],
  occasionDate: string,
  result: BirthdayRunResult,
): Promise<void> {
  const pending = members.filter((m) => !m.alreadyDone)
  if (!pending.length) return

  const [recipients, settings] = await Promise.all([
    getTeamRecipients(admin),
    getEmailSettings(admin),
  ])

  const sent = await sendEmail({
    to:      recipients,
    subject: `Birthday tomorrow: ${pending.map((m) => m.name).join(', ')} — 4W'S Inua Jamii Foundation`,
    from:    settings.fromHeader,
    html:    birthdayTeamReminderHtml({
      celebrationDate: formatBirthdayDayMonth(occasionDate),
      members: pending.map((m) => ({ name: m.name, tier: m.tier, isPublic: m.isPublic })),
    }),
  })

  if (!sent.success) {
    result.errors.push(`team reminder: ${sent.error ?? 'send failed'}`)
    return
  }

  await recordNotified(admin, 'team_reminder', occasionDate, pending.map((m) => m.userId))
  result.remindersSent = pending.length
}

/**
 * On the day: a personal greeting email plus an in-app notification, for
 * members who did not opt out of greetings. The dashboard celebration itself
 * is rendered live and needs no record here.
 */
async function sendMemberGreetings(
  admin: AdminClient,
  members: PendingMember[],
  occasionDate: string,
  result: BirthdayRunResult,
): Promise<void> {
  const pending = members.filter((m) => !m.alreadyDone && m.receiveGreetings)
  if (!pending.length) return

  const [emails, settings] = await Promise.all([
    getMemberEmails(admin, pending.map((m) => m.userId)),
    getEmailSettings(admin),
  ])

  const greeted: string[] = []

  for (const member of pending) {
    const to = emails.get(member.userId)
    if (!to) {
      result.skipped++
      continue
    }
    const sent = await sendEmail({
      to,
      subject: `Happy Birthday, ${member.name}! — 4W'S Inua Jamii Foundation`,
      from:    settings.fromHeader,
      html:    birthdayGreetingHtml({ name: member.name }),
    })
    if (sent.success) greeted.push(member.userId)
    else result.errors.push(`greeting ${member.userId}: ${sent.error ?? 'send failed'}`)
  }

  if (greeted.length) {
    const { error } = await admin.from('notifications').insert(
      greeted.map((user_id) => ({
        user_id,
        type:  'general',
        title: 'Happy Birthday! 🎂',
        body:  `The whole 4W'S family wishes you a wonderful day.`,
        link:  '/dashboard',
      })),
    )
    if (error) console.error('[birthdays] in-app notification failed:', error.message)
  }

  await recordNotified(admin, 'member_greeting', occasionDate, greeted)
  result.greetingsSent = greeted.length
}

/**
 * Daily birthday job. Idempotent: re-running on the same day sends nothing
 * twice, because every delivery is recorded in `birthday_notifications`.
 */
export async function runBirthdayNotifications(now: Date = new Date()): Promise<BirthdayRunResult> {
  const admin = createAdminClient()
  const today    = todayInZone(now)
  const tomorrow = addDays(today, 1)

  const result: BirthdayRunResult = {
    today, remindersSent: 0, greetingsSent: 0, skipped: 0, errors: [],
  }

  const members = await loadBirthdayMembers(admin)

  const celebratingTomorrow = members.filter((m) => isBirthdayOn(m.birthDate, tomorrow))
  const celebratingToday    = members.filter((m) => isBirthdayOn(m.birthDate, today))

  const [remindedIds, greetedIds] = await Promise.all([
    alreadyNotified(admin, 'team_reminder',   tomorrow, celebratingTomorrow.map((m) => m.userId)),
    alreadyNotified(admin, 'member_greeting', today,    celebratingToday.map((m) => m.userId)),
  ])

  await sendTeamReminder(
    admin,
    celebratingTomorrow.map((m) => ({ ...m, alreadyDone: remindedIds.has(m.userId) })),
    tomorrow,
    result,
  )
  await sendMemberGreetings(
    admin,
    celebratingToday.map((m) => ({ ...m, alreadyDone: greetedIds.has(m.userId) })),
    today,
    result,
  )

  return result
}
