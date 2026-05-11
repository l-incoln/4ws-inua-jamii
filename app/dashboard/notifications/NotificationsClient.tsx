'use client'

import { useTransition } from 'react'
import { markNotificationRead, markAllNotificationsRead } from '@/app/actions/notifications'
import type { Notification } from '@/types'
import { CheckCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const TYPE_ICONS: Record<string, string> = {
  membership_expiry: '⏰',
  event_invite: '📅',
  announcement: '📢',
  badge_awarded: '🏅',
  general: '🔔',
}

interface Props {
  notification?: Notification
  markAll?: boolean
}

export default function NotificationsClient({ notification, markAll }: Props) {
  const [pending, startTransition] = useTransition()

  if (markAll) {
    return (
      <button
        onClick={() => startTransition(() => { void markAllNotificationsRead() })}
        disabled={pending}
        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
      >
        <CheckCheck className="w-4 h-4" />
        Mark all read
      </button>
    )
  }

  if (!notification) return null

  const { id, type, title, body, read, link, created_at } = notification
  const icon = TYPE_ICONS[type] ?? '🔔'

  return (
    <div
      className={`flex items-start gap-3.5 px-5 py-4 transition-colors ${read ? 'bg-white' : 'bg-blue-50/40'}`}
    >
      <div className="text-xl mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${read ? 'text-slate-700' : 'text-slate-900'}`}>{title}</p>
          <p className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
            {new Date(created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        {body && <p className="text-sm text-slate-500 mt-0.5">{body}</p>}
        <div className="flex items-center gap-3 mt-1.5">
          {link && (
            <Link href={link} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> View
            </Link>
          )}
          {!read && (
            <button
              onClick={() => startTransition(() => { void markNotificationRead(id) })}
              disabled={pending}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
      {!read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
    </div>
  )
}
