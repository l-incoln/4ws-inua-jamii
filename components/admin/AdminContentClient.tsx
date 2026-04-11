'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PlusCircle, Edit2, Trash2, Eye, Search, FileText, Leaf, ToggleLeft, ToggleRight } from 'lucide-react'

type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string | null
  status: 'draft' | 'published' | 'scheduled'
  views: number
  read_time: string | null
  published_at: string | null
  created_at: string
}

type Program = {
  id: string
  slug: string
  title: string
  description: string | null
  beneficiaries: number
  is_active: boolean
  created_at: string
}

const statusStyles: Record<string, string> = {
  published: 'badge-green',
  draft:     'badge-gray',
  scheduled: 'badge-sky',
}

export default function AdminContentClient({
  posts,
  programs,
  deleteBlogPost,
  togglePostStatus,
}: {
  posts: Post[]
  programs: Program[]
  deleteBlogPost: (id: string) => Promise<{ error?: unknown; success?: boolean }>
  togglePostStatus: (id: string, status: string) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [tab, setTab]     = useState<'blog' | 'programs'>('blog')
  const [search, setSearch] = useState('')
  const [isPending, start] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (!confirm('Permanently delete this post? This cannot be undone.')) return
    setActionId(id)
    start(async () => {
      await deleteBlogPost(id)
      setActionId(null)
    })
  }

  const handleToggle = (id: string, status: string) => {
    setActionId(id)
    start(async () => {
      await togglePostStatus(id, status)
      setActionId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {tab === 'blog'
              ? `${posts.length} posts · ${posts.filter((p) => p.status === 'published').length} published`
              : `${programs.length} programs · ${programs.filter((p) => p.is_active).length} active`}
          </p>
        </div>
        {tab === 'blog' && (
          <Link href="/admin/content/new" className="btn-primary text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            New Post
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('blog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'blog' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Blog Posts
        </button>
        <button
          onClick={() => setTab('programs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'programs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Leaf className="w-4 h-4" /> Programs
        </button>
      </div>

      {tab === 'blog' && (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No posts yet</p>
                <p className="text-slate-400 text-sm mt-1">Create your first post to get started</p>
                <Link href="/admin/content/new" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Write First Post
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-5 py-3.5 text-left">Title</th>
                      <th className="px-5 py-3.5 text-left">Category</th>
                      <th className="px-5 py-3.5 text-left">Date</th>
                      <th className="px-5 py-3.5 text-left">Views</th>
                      <th className="px-5 py-3.5 text-left">Status</th>
                      <th className="px-5 py-3.5 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-cell font-semibold text-slate-800 max-w-xs">
                          <div className="truncate">{post.title}</div>
                          {post.read_time && (
                            <div className="text-xs text-slate-400 font-normal">{post.read_time}</div>
                          )}
                        </td>
                        <td className="table-cell">
                          {post.category && <span className="badge-gray text-xs">{post.category}</span>}
                        </td>
                        <td className="table-cell text-sm text-slate-500">
                          {new Date(post.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="table-cell text-sm text-slate-600">
                          {(post.views ?? 0).toLocaleString()}
                        </td>
                        <td className="table-cell">
                          <span className={statusStyles[post.status] ?? 'badge-gray'}>{post.status}</span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            {post.status === 'published' ? (
                              <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                                title="View live"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            ) : null}
                            <button
                              onClick={() => handleToggle(post.id, post.status)}
                              disabled={actionId === post.id && isPending}
                              title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {post.status === 'published'
                                ? <ToggleRight className="w-3.5 h-3.5" />
                                : <ToggleLeft className="w-3.5 h-3.5" />}
                            </button>
                            <Link
                              href={`/admin/content/${post.id}/edit`}
                              className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(post.id)}
                              disabled={actionId === post.id && isPending}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'programs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programs.length === 0 && (
            <div className="col-span-2 p-12 text-center card">
              <Leaf className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No programs yet</p>
            </div>
          )}
          {programs.map((program) => (
            <div key={program.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-primary-600" />
                </div>
                <span className={program.is_active ? 'badge-green text-xs' : 'badge-gray text-xs'}>
                  {program.is_active ? 'active' : 'inactive'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900">{program.title}</h3>
              {program.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{program.description}</p>
              )}
              <p className="text-sm text-slate-400 mt-1">{program.beneficiaries.toLocaleString()} beneficiaries</p>
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/programs/${program.slug}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-slate-500 text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
