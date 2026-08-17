'use client'

import { useState, useTransition } from 'react'
import { Bell, Send, AlertCircle, CheckCircle, Users, User, X } from 'lucide-react'
import type { NotificationType } from '@/types'

type Member = {
  id: string
  full_name: string | null
  email: string | null
  membership_status: string
  role: string
}

type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

type Toast = { type: 'success' | 'error'; msg: string }

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: 'general',      label: 'General' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'event',        label: 'Event' },
  { value: 'donation',     label: 'Donation' },
  { value: 'membership_expiry', label: 'Membership Expiry' },
  { value: 'badge',        label: 'Badge' },
  { value: 'task',         label: 'Task' },
  { value: 'system',       label: 'System' },
]

export default function AdminNotificationsClient({
  recent,
  members,
  sendNotification,
}: {
  recent: Notification[]
  members: Member[]
  sendNotification: (args: {
    userId?: string
    type: NotificationType
    title: string
    body?: string
    link?: string
  }) => Promise<{ error?: string; success?: boolean }>
}) {
  const [isPending, start] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)

  // Form state
  const [audience, setAudience] = useState<'all' | 'specific'>('all')
  const [recipientId, setRecipientId] = useState('')
  const [type, setType] = useState<NotificationType>('general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')

  const showToast = (t: Toast) => { setToast(t); setTimeout(() => setToast(null), 4000) }

  const approvedMembers = members.filter((m) => m.membership_status === 'approved')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) {
      showToast({ type: 'error', msg: 'Title is required' })
      return
    }
    if (audience === 'specific' && !recipientId) {
      showToast({ type: 'error', msg: 'Please select a recipient' })
      return
    }

    start(async () => {
      const result = await sendNotification({
        userId: audience === 'specific' ? recipientId : undefined,
        type,
        title: title.trim(),
        body: body.trim() || undefined,
        link: link.trim() || undefined,
      })
      if (result?.error) {
        showToast({ type: 'error', msg: result.error })
      } else {
        const count = audience === 'all' ? `${approvedMembers.length} members` : '1 member'
        showToast({ type: 'success', msg: `Notification sent to ${count}.` })
        setTitle(''); setBody(''); setLink('')
        setRecipientId('')
        setAudience('all')
        setType('general')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 text-sm mt-1">
          Send in-app notifications to members. They appear in the dashboard bell icon.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Compose form */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-slate-900">Compose Notification</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Audience */}
          <div>
            <label className="label">Audience</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAudience('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
                  audience === 'all'
                    ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                All approved members ({approvedMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setAudience('specific')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
                  audience === 'specific'
                    ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4" />
                Specific member
              </button>
            </div>
          </div>

          {/* Recipient (only when specific) */}
          {audience === 'specific' && (
            <div>
              <label className="label">Recipient <span className="text-red-500">*</span></label>
              <select
                className="input"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                required
              >
                <option value="">Select a member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? 'Unnamed'} {m.role === 'admin' ? '· admin' : ''} {m.role === 'volunteer' ? '· volunteer' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input
              required
              className="input"
              placeholder="e.g. New event coming up!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Body */}
          <div>
            <label className="label">Body <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="More details about the notification…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Link */}
          <div>
            <label className="label">Link <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              className="input"
              placeholder="/dashboard/events or https://…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">Internal dashboard paths or external URLs.</p>
          </div>

          <div className="pt-1">
            <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
              <Send className="w-4 h-4" />
              {isPending ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Recent Notifications</h2>
          <span className="text-xs text-slate-400">last {recent.length}</span>
        </div>

        {recent.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No notifications sent yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recent.map((n) => {
              const member = members.find((m) => m.id === n.user_id)
              return (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-slate-300' : 'bg-primary-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">{n.title}</span>
                      <span className="badge-sky text-[10px] capitalize">{n.type.replace('_', ' ')}</span>
                      {!n.read && <span className="text-[10px] text-primary-600 font-medium">unread</span>}
                    </div>
                    {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {member?.full_name ?? 'Unknown'} · {new Date(n.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
