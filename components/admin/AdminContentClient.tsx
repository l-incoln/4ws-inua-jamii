'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PlusCircle, Edit2, Trash2, Eye, Search, FileText, Leaf, ToggleLeft, ToggleRight, X, Loader2, CheckCircle2 } from 'lucide-react'

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

type ProgramFormState = {
  id?: string
  title: string
  slug: string
  description: string
  icon: string
  image_url: string
  beneficiary_count: string
  is_active: boolean
}

const EMPTY_FORM: ProgramFormState = {
  title: '', slug: '', description: '', icon: '', image_url: '', beneficiary_count: '0', is_active: true,
}

const statusStyles: Record<string, string> = {
  published: 'badge-green',
  draft:     'badge-gray',
  scheduled: 'badge-sky',
}

export default function AdminContentClient({
  posts,
  programs: initialPrograms,
  deleteBlogPost,
  togglePostStatus,
  saveProgram,
  deleteProgram,
  toggleProgramStatus,
}: {
  posts: Post[]
  programs: Program[]
  deleteBlogPost: (id: string) => Promise<{ error?: unknown; success?: boolean }>
  togglePostStatus: (id: string, status: string) => Promise<{ error?: unknown; success?: boolean }>
  saveProgram: (formData: FormData, programId?: string) => Promise<{ error?: unknown; success?: boolean }>
  deleteProgram: (id: string) => Promise<{ error?: unknown; success?: boolean }>
  toggleProgramStatus: (id: string, isActive: boolean) => Promise<{ error?: unknown; success?: boolean }>
}) {
  const [tab, setTab]     = useState<'blog' | 'programs'>('blog')
  const [search, setSearch] = useState('')
  const [isPending, start] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  // Program form
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [programForm, setProgramForm] = useState<ProgramFormState>(EMPTY_FORM)
  const [programError, setProgramError] = useState<string | null>(null)
  const [programSuccess, setProgramSuccess] = useState(false)

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

  function openNewProgram() {
    setProgramForm(EMPTY_FORM)
    setProgramError(null)
    setProgramSuccess(false)
    setShowProgramForm(true)
  }

  function openEditProgram(p: Program) {
    setProgramForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description ?? '',
      icon: '',
      image_url: '',
      beneficiary_count: String(p.beneficiaries),
      is_active: p.is_active,
    })
    setProgramError(null)
    setProgramSuccess(false)
    setShowProgramForm(true)
  }

  async function handleSaveProgram(e: React.FormEvent) {
    e.preventDefault()
    setProgramError(null)
    const fd = new FormData()
    fd.set('title', programForm.title)
    fd.set('slug', programForm.slug)
    fd.set('description', programForm.description)
    fd.set('icon', programForm.icon)
    fd.set('image_url', programForm.image_url)
    fd.set('beneficiary_count', programForm.beneficiary_count)
    fd.set('is_active', String(programForm.is_active))

    start(async () => {
      const result = await saveProgram(fd, programForm.id)
      if (result.error) {
        setProgramError(String(result.error))
      } else {
        setProgramSuccess(true)
        setTimeout(() => {
          setShowProgramForm(false)
          setProgramSuccess(false)
        }, 1000)
      }
    })
  }

  function handleDeleteProgram(id: string) {
    if (!confirm('Delete this program? This cannot be undone.')) return
    setActionId(id)
    start(async () => {
      await deleteProgram(id)
      setActionId(null)
    })
  }

  function handleToggleProgram(id: string, isActive: boolean) {
    setActionId(id)
    start(async () => {
      await toggleProgramStatus(id, !isActive)
      setActionId(null)
    })
  }

  // Auto-generate slug from title
  function handleTitleChange(value: string) {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setProgramForm((f) => ({ ...f, title: value, ...(!f.id ? { slug } : {}) }))
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
              : `${initialPrograms.length} programs · ${initialPrograms.filter((p) => p.is_active).length} active`}
          </p>
        </div>
        {tab === 'blog' && (
          <Link href="/admin/content/new" className="btn-primary text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            New Post
          </Link>
        )}
        {tab === 'programs' && (
          <button onClick={openNewProgram} className="btn-primary text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            New Program
          </button>
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialPrograms.length === 0 && (
              <div className="col-span-2 p-12 text-center card">
                <Leaf className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No programs yet</p>
                <button onClick={openNewProgram} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Add First Program
                </button>
              </div>
            )}
            {initialPrograms.map((program) => (
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
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/programs/${program.slug}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-slate-500 text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <button
                    onClick={() => handleToggleProgram(program.id, program.is_active)}
                    disabled={actionId === program.id && isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                    title={program.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {program.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {program.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEditProgram(program)}
                    className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(program.id)}
                    disabled={actionId === program.id && isPending}
                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Program Form Modal */}
      {showProgramForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-slate-900">
                {programForm.id ? 'Edit Program' : 'New Program'}
              </h2>
              <button
                onClick={() => setShowProgramForm(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {programError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                {programError}
              </div>
            )}

            {programSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 text-green-700 text-sm border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  className="input"
                  value={programForm.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="e.g. Youth Empowerment"
                />
              </div>
              <div>
                <label className="label">Slug *</label>
                <input
                  className="input font-mono text-sm"
                  value={programForm.slug}
                  onChange={(e) => setProgramForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  placeholder="youth-empowerment"
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, hyphens only"
                />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input min-h-[100px] resize-y"
                  value={programForm.description}
                  onChange={(e) => setProgramForm((f) => ({ ...f, description: e.target.value }))}
                  required
                  placeholder="Brief description of the program…"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Icon (emoji or name)</label>
                  <input
                    className="input"
                    value={programForm.icon}
                    onChange={(e) => setProgramForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="🌱"
                  />
                </div>
                <div>
                  <label className="label">Beneficiary Count</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={programForm.beneficiary_count}
                    onChange={(e) => setProgramForm((f) => ({ ...f, beneficiary_count: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Image URL</label>
                <input
                  className="input"
                  type="url"
                  value={programForm.image_url}
                  onChange={(e) => setProgramForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="prog-active"
                  className="w-4 h-4 rounded accent-primary-600"
                  checked={programForm.is_active}
                  onChange={(e) => setProgramForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <label htmlFor="prog-active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Active (visible on public site)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isPending ? 'Saving…' : (programForm.id ? 'Save Changes' : 'Create Program')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProgramForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


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
