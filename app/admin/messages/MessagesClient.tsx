'use client'

import { useState, useTransition } from 'react'
import { Mail, MailOpen, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Inbox, Reply } from 'lucide-react'

type Message = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

type Toast = { type: 'success' | 'error'; msg: string }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

export default function MessagesClient({
  messages: initial,
  unreadCount: initialUnread,
  markRead,
  deleteMessage,
}: {
  messages: Message[]
  unreadCount: number
  markRead: (id: string, isRead: boolean) => Promise<{ error?: unknown; success?: boolean }>
  deleteMessage: (id: string) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [isPending, start] = useTransition()
  const [messages, setMessages] = useState<Message[]>(initial)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const showToast = (t: Toast) => {
    setToast(t)
    setTimeout(() => setToast(null), 4000)
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  const filtered = messages.filter((m) => {
    if (filter === 'unread') return !m.is_read
    if (filter === 'read') return m.is_read
    return true
  })

  function handleExpand(msg: Message) {
    if (expandedId === msg.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(msg.id)
    // Auto-mark as read when opened
    if (!msg.is_read) {
      setActionId(msg.id)
      start(async () => {
        const result = await markRead(msg.id, true)
        if (!result.error) {
          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m))
        }
        setActionId(null)
      })
    }
  }

  function handleToggleRead(e: React.MouseEvent, msg: Message) {
    e.stopPropagation()
    setActionId(msg.id)
    start(async () => {
      const result = await markRead(msg.id, !msg.is_read)
      if (result.error) {
        showToast({ type: 'error', msg: result.error as string })
      } else {
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: !m.is_read } : m))
      }
      setActionId(null)
    })
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setConfirmDeleteId(id)
  }

  function confirmDelete() {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setActionId(id)
    start(async () => {
      const result = await deleteMessage(id)
      if (result.error) {
        showToast({ type: 'error', msg: result.error as string })
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== id))
        if (expandedId === id) setExpandedId(null)
        showToast({ type: 'success', msg: 'Message deleted.' })
      }
      setActionId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
          <p className="text-slate-500 text-sm mt-1">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-sm">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-primary-50 text-primary-800 border border-primary-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Delete message?</h3>
            <p className="text-slate-600 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages list */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {filter === 'unread' ? 'No unread messages' : filter === 'read' ? 'No read messages' : 'No messages yet'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Messages submitted via the contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => {
            const isExpanded = expandedId === msg.id
            const isActing = actionId === msg.id && isPending
            return (
              <div
                key={msg.id}
                className={`card transition-all ${!msg.is_read ? 'border-l-4 border-primary-500 bg-primary-50/30' : ''}`}
              >
                {/* Row header */}
                <button
                  onClick={() => handleExpand(msg)}
                  className="w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50/50 transition-colors rounded-t-2xl"
                >
                  {/* Icon */}
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-primary-100 text-primary-600'
                  }`}>
                    {msg.is_read
                      ? <MailOpen className="w-4 h-4" />
                      : <Mail className="w-4 h-4" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm truncate ${msg.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{msg.email}</span>
                      {!msg.is_read && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary-600 text-white rounded-full font-semibold">New</span>
                      )}
                    </div>
                    <div className={`text-sm truncate mt-0.5 ${msg.is_read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>
                      {msg.subject}
                    </div>
                    {!isExpanded && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">{msg.message}</div>
                    )}
                  </div>

                  {/* Meta + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(msg.created_at)}</span>
                    <button
                      onClick={(e) => handleToggleRead(e, msg)}
                      disabled={isActing}
                      title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                      {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, msg.id)}
                      disabled={isActing}
                      title="Delete message"
                      className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded message body */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 mt-0 pt-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{msg.name}</span>
                        {' — '}
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          className="text-primary-600 hover:underline"
                        >
                          {msg.email}
                        </a>
                        {' · '}
                        {new Date(msg.created_at).toLocaleString('en-KE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        Reply via Email
                      </a>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 mb-2">
                      Subject: {msg.subject}
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                      {msg.message}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
