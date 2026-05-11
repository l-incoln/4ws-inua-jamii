'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, CheckCircle, XCircle, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { approveComment, deleteComment } from '@/app/actions/admin'

interface BlogPost {
  title: string
  slug: string
}

interface Comment {
  id: string
  post_id: string
  author_name: string | null
  body: string
  is_approved: boolean
  parent_id: string | null
  created_at: string
  blog_posts: BlogPost | null
}

type Filter = 'pending' | 'approved' | 'all'

export default function CommentsClient({ comments: initial }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initial)
  const [filter, setFilter] = useState<Filter>('pending')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleApprove(id: string, approve: boolean) {
    startTransition(async () => {
      const result = await approveComment(id, approve)
      if (result?.error) { showToast(result.error); return }
      setComments((prev) => prev.map((c) => c.id === id ? { ...c, is_approved: approve } : c))
      showToast(approve ? 'Comment approved.' : 'Comment hidden.')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id)
      if (result?.error) { showToast(result.error); return }
      setComments((prev) => prev.filter((c) => c.id !== id))
      showToast('Comment deleted.')
      setConfirmDelete(null)
    })
  }

  const filtered = comments.filter((c) => {
    if (filter === 'pending') return !c.is_approved
    if (filter === 'approved') return c.is_approved
    return true
  })

  const pendingCount = comments.filter((c) => !c.is_approved).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Comments</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pendingCount > 0 ? (
              <span className="text-amber-600 font-medium">{pendingCount} pending review</span>
            ) : (
              'All comments reviewed'
            )}
          </p>
        </div>
      </div>

      {toast && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />{toast}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['pending', 'approved', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}{f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {filter === 'pending' ? 'No comments pending review' : 'No comments found'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className={`card p-5 ${!c.is_approved ? 'border-l-4 border-amber-300' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-semibold text-slate-900 text-sm">{c.author_name ?? 'Anonymous'}</span>
                  {c.is_approved
                    ? <span className="badge badge-green text-xs">Approved</span>
                    : <span className="badge badge-gray text-xs">Pending</span>
                  }
                  {c.parent_id && <span className="text-xs text-slate-400">↳ Reply</span>}
                  <span className="text-xs text-slate-400 ml-auto">
                    {new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{c.body}</p>
                {c.blog_posts && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    On: <span className="text-primary-600 font-medium">{c.blog_posts.title}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {c.is_approved ? (
                  <button
                    onClick={() => handleApprove(c.id, false)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    title="Hide comment"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(c.id, true)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                    title="Approve comment"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(c.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <h3 className="font-bold text-slate-900">Delete Comment?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} disabled={isPending} className="btn-primary bg-red-600 hover:bg-red-700 text-sm flex-1">
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
