import type { createAdminClient } from '@/lib/supabase/admin-client'

type AdminClient = ReturnType<typeof createAdminClient>

/** Emails are stored in auth.users, which is not reachable through PostgREST. */
export async function getMemberEmails(
  admin: AdminClient,
  profileIds: string[],
): Promise<Map<string, string>> {
  const emails = new Map<string, string>()
  if (!profileIds.length) return emails

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
