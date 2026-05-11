import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Notification } from '@/types'
import Link from 'next/link'
import { Bell, BellOff, ExternalLink, CheckCheck } from 'lucide-react'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Notifications | Dashboard' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: raw } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications: Notification[] = raw ?? []
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && <NotificationsClient markAll />}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 space-y-3">
          <BellOff className="w-10 h-10 mx-auto" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm">You&apos;ll see foundation updates, event invites, and badge awards here.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => (
            <NotificationsClient key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}
