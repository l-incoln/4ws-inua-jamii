'use client'

import { useState, useTransition, useRef } from 'react'
import { saveBlogPost } from '@/app/actions/admin'
import {
  Eye, EyeOff, Bold, Italic, List, Link2, Heading2, Quote,
  ImageIcon, AlertCircle, CheckCircle,
} from 'lucide-react'
import ImageUpload from './ImageUpload'

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string | null
  category: string | null
  tags: string[] | null
  image_url: string | null
  status: 'draft' | 'published' | 'scheduled'
  read_time: string | null
}

const CATEGORIES = ['Health', 'Education', 'Environment', 'Empowerment', 'Community', 'Updates', 'Stories', 'Impact']

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function estimateReadTime(body: string): string {
  const words = body.trim().split(/\s+/).length
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}

// Very simple markdown renderer for preview
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{2}\s(.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^#{3}\s(.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^#{1}\s(.+)$/gm, '<h1 class="text-2xl font-bold mt-5 mb-2">$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^>\s(.+)$/gm, '<blockquote class="border-l-4 border-sky-400 pl-3 italic text-slate-500 my-2">$1</blockquote>')
    .replace(/^[-*]\s(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sky-600 underline">$1</a>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/^(?!<[h|b|l|p|i])(.+)$/gm, '<p class="mb-3">$1</p>')
}

export default function BlogEditor({ post }: { post?: BlogPost }) {
  const isEdit = Boolean(post?.id)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview]       = useState(false)
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [title,    setTitle]    = useState(post?.title     ?? '')
  const [slug,     setSlug]     = useState(post?.slug      ?? '')
  const [excerpt,  setExcerpt]  = useState(post?.excerpt   ?? '')
  const [body,     setBody]     = useState(post?.body      ?? '')
  const [category, setCategory] = useState(post?.category  ?? 'Updates')
  const [tags,     setTags]     = useState(post?.tags?.join(', ') ?? '')
  const [imageUrl, setImageUrl] = useState(post?.image_url ?? '')
  const [status,   setStatus]   = useState<'draft' | 'published' | 'scheduled'>(post?.status ?? 'draft')
  const [readTime, setReadTime] = useState(post?.read_time ?? '')

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!isEdit) setSlug(slugify(v))
    setReadTime(estimateReadTime(body || v))
  }

  const handleBodyChange = (v: string) => {
    setBody(v)
    setReadTime(estimateReadTime(v))
  }

  // Toolbar insertions
  const insert = (before: string, after = '') => {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = body.slice(start, end) || 'text'
    const next  = body.slice(0, start) + before + sel + after + body.slice(end)
    setBody(next)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + sel.length)
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveBlogPost(fd, post?.id)
      if (result?.error) {
        setToast({ type: 'error', msg: result.error as string })
        setTimeout(() => setToast(null), 4000)
      }
      // On success, saveBlogPost redirects — so no extra handling needed
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Post' : 'New Blog Post'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isEdit ? `Editing: ${post?.title}` : 'Write and publish a new article'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary text-sm"
          >
            {isPending ? 'Saving…' : status === 'published' ? 'Publish' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* ── Main editor column ── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Title */}
          <div>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title…"
              className="w-full text-2xl font-bold text-slate-900 bg-transparent border-0 border-b-2 border-slate-200 focus:border-primary-500 outline-none pb-2 transition placeholder:text-slate-300"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="label">Excerpt <span className="text-slate-400 font-normal">(shown in card previews)</span></label>
            <textarea
              name="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short description of the post…"
              className="input resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Body <span className="text-slate-400 font-normal">(Markdown supported)</span></label>
              {readTime && <span className="text-xs text-slate-400">{readTime}</span>}
            </div>
            {/* Markdown toolbar */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 border border-b-0 border-slate-200 rounded-t-lg">
              {[
                { icon: Heading2, action: () => insert('## '), title: 'Heading' },
                { icon: Bold,     action: () => insert('**', '**'), title: 'Bold' },
                { icon: Italic,   action: () => insert('*', '*'), title: 'Italic' },
                { icon: List,     action: () => insert('- '), title: 'List' },
                { icon: Quote,    action: () => insert('> '), title: 'Quote' },
                { icon: Link2,    action: () => insert('[', '](url)'), title: 'Link' },
                { icon: ImageIcon,action: () => insert('![alt](', ')'), title: 'Image' },
              ].map(({ icon: Icon, action, title }) => (
                <button
                  key={title}
                  type="button"
                  title={title}
                  onClick={action}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600 transition"
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            {preview ? (
              <div
                className="min-h-[360px] p-4 border border-slate-200 rounded-b-lg bg-white prose prose-sm max-w-none text-slate-700 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
              />
            ) : (
              <textarea
                name="body"
                ref={bodyRef}
                rows={18}
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Start writing your post in Markdown…&#10;&#10;## Subheading&#10;**Bold**, *italic*, - list items, > quotes…"
                className="w-full p-4 border border-slate-200 rounded-b-lg font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 transition resize-y"
              />
            )}
          </div>
        </div>

        {/* ── Sidebar settings column ── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Status */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Publish Settings</h3>
            <div>
              <label className="label">Status</label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="input text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <input type="hidden" name="read_time" value={readTime} />
          </div>

          {/* Meta */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Post Details</h3>
            <div>
              <label className="label">Slug</label>
              <input
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
                className="input text-sm font-mono"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input text-sm"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <input
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="health, kenya, impact"
                className="input text-sm"
              />
            </div>
          </div>

          {/* Cover image */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Cover Image</h3>
            <ImageUpload
              name="image_url"
              defaultValue={post?.image_url}
              folder="blog"
              label=""
              onChange={(url) => setImageUrl(url)}
            />
          </div>
        </div>
      </div>
    </form>
  )
}
