import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AdminNotificationsClient from '@/components/admin/AdminNotificationsClient'
import { sendNotification } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Notifications | Admin' }

export default async function AdminNotificationsPage() {
  const supabase = await createClient()

  // Recent notifications (last 100) for audit trail
  const { data: recent } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, link, read, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Members for the targeted recipient dropdown
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, membership_status, role')
    .order('full_name', { ascending: true })

  return (
    <AdminNotificationsClient
      recent={recent ?? []}
      members={(members ?? []).map((m) => ({
        id: m.id,
        full_name: m.full_name,
        email: (m as any).email ?? null,
        membership_status: m.membership_status,
        role: m.role,
      }))}
      sendNotification={sendNotification}
    />
  )
}
