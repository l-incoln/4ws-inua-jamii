'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Reply, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { submitComment } from '@/app/actions/comments'

interface Comment {
  id: string
  author_name: string | null
  body: string
  created_at: string
  parent_id: string | null
}

interface Props {
  postId: string
  comments: Comment[]
  isLoggedIn: boolean
  userName?: string
}

export default function BlogComments({ postId, comments, isLoggedIn, userName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [guestName, setGuestName] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Only top-level comments
  const roots  = comments.filter((c) => !c.parent_id)
  const replies = comments.filter((c) => c.parent_id)

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 5000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      const result = await submitComment(postId, body, isLoggedIn ? undefined : guestName || undefined)
      if (result?.error) { showToast('error', result.error); return }
      setBody('')
      setGuestName('')
      setSubmitted(true)
      showToast('success', 'Comment submitted! It will appear after moderation.')
    })
  }

  function handleReply(e: React.FormEvent, parentId: string) {
    e.preventDefault()
    if (!replyBody.trim()) return
    startTransition(async () => {
      const result = await submitComment(postId, replyBody, isLoggedIn ? undefined : guestName || undefined, parentId)
      if (result?.error) { showToast('error', result.error); return }
      setReplyBody('')
      setReplyingTo(null)
      showToast('success', 'Reply submitted! It will appear after moderation.')
    })
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-600" />
        Comments
        {comments.length > 0 && (
          <span className="text-sm font-normal text-slate-400">({comments.length})</span>
        )}
      </h2>

      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-5 ${
          toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Comment list */}
      {roots.length === 0 ? (
        <div className="text-center py-8 text-slate-400 mb-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {roots.map((c) => {
            const commentReplies = replies.filter((r) => r.parent_id === c.id)
            return (
              <div key={c.id} className="space-y-3">
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                      {(c.author_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{c.author_name ?? 'Anonymous'}</p>
                      <p className="text-xs text-slate-400">{fmt(c.created_at)}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      className="ml-auto text-xs text-slate-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" /> Reply
                    </button>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{c.body}</p>

                  {/* Reply form */}
                  {replyingTo === c.id && (
                    <form onSubmit={(e) => handleReply(e, c.id)} className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {!isLoggedIn && (
                        <input
                          className="input text-sm"
                          placeholder="Your name *"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          required
                        />
                      )}
                      <div className="flex gap-2">
                        <textarea
                          className="input resize-none text-sm flex-1"
                          rows={2}
                          placeholder="Write a reply…"
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          required
                        />
                        <button type="submit" disabled={isPending} className="btn-primary text-sm px-4 self-end">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Replies */}
                {commentReplies.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {commentReplies.map((r) => (
                      <div key={r.id} className="card p-3.5 border-l-2 border-primary-200">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">
                            {(r.author_name ?? '?')[0].toUpperCase()}
                          </div>
                          <p className="font-medium text-slate-900 text-xs">{r.author_name ?? 'Anonymous'}</p>
                          <p className="text-xs text-slate-400 ml-auto">{fmt(r.created_at)}</p>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New comment form */}
      {!submitted ? (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">
            {isLoggedIn ? `Comment as ${userName ?? 'yourself'}` : 'Leave a Comment'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLoggedIn && (
              <div>
                <label className="label text-xs">Your Name *</label>
                <input
                  className="input"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label text-xs">Comment *</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Share your thoughts…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-slate-400">Comments are reviewed before appearing publicly.</p>
            <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
              <Send className="w-4 h-4" />
              {isPending ? 'Submitting…' : 'Post Comment'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card p-5 text-center text-green-700 bg-green-50">
          <CheckCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="font-medium text-sm">Thanks for your comment!</p>
          <p className="text-xs text-green-600 mt-1">It will appear after moderation.</p>
          <button onClick={() => setSubmitted(false)} className="text-xs text-green-600 underline mt-2">Add another comment</button>
        </div>
      )}
    </section>
  )
}
