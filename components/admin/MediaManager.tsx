'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Upload, Trash2, Edit2, X, Check, Search, Filter,
  ImageIcon, FileText, Copy, CheckCheck, Loader2,
  LayoutGrid, List, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, ExternalLink, Tag, Eye, Info, FolderOpen, ZoomIn,
} from 'lucide-react'
import {
  uploadMediaAsset, updateMediaAsset, deleteMediaAsset,
  bulkDeleteMediaAssets, getAssetUsage,
} from '@/app/actions/media'
import type { MediaFolder, AssetUsage } from '@/app/actions/media'
import { generateVariants, formatBytes } from '@/lib/compress-image'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MediaAsset = {
  id:           string
  url:          string
  thumb_url:    string | null
  storage_path: string
  file_name:    string
  file_size:    number
  mime_type:    string
  file_type:    'image' | 'document'
  alt_text:     string | null
  title:        string | null
  description:  string | null
  tags:         string[]
  folder:       string
  created_at:   string
}

type UploadEntry = {
  file:        File
  thumbFile:   File | null
  title:       string
  status:      'pending' | 'compressing' | 'uploading' | 'done' | 'error'
  error?:      string
  originalSize: number
  compressedSize?: number
}

type Props = {
  initialItems: MediaAsset[]
  initialTotal: number
  folder:       string
  fileType:     string
  page:         number
  q:            string
  tag:          string
  perPage:      number
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const FOLDERS: { value: string; label: string; emoji: string }[] = [
  { value: 'all',       label: 'All',       emoji: '📁' },
  { value: 'general',   label: 'General',   emoji: '🗂️' },
  { value: 'team',      label: 'Team',      emoji: '👥' },
  { value: 'programs',  label: 'Programs',  emoji: '🎯' },
  { value: 'events',    label: 'Events',    emoji: '📅' },
  { value: 'gallery',   label: 'Gallery',   emoji: '🖼️' },
  { value: 'blog',      label: 'Blog',      emoji: '📰' },
  { value: 'documents', label: 'Documents', emoji: '📄' },
]

const UPLOAD_FOLDERS = FOLDERS.filter((f) => f.value !== 'all')

const TYPE_TABS = [
  { value: 'all',      label: 'All types' },
  { value: 'image',    label: 'Images'    },
  { value: 'document', label: 'Documents' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isImage(mimeOrType: string) {
  return mimeOrType === 'image' || mimeOrType.startsWith('image/')
}

function buildUrl(params: { folder?: string; fileType?: string; page?: number; q?: string; tag?: string }) {
  const p = new URLSearchParams()
  if (params.folder   && params.folder   !== 'all') p.set('folder',   params.folder)
  if (params.fileType && params.fileType !== 'all') p.set('type',     params.fileType)
  if (params.page     && params.page > 1)           p.set('page',     String(params.page))
  if (params.q)                                     p.set('q',        params.q)
  if (params.tag)                                   p.set('tag',      params.tag)
  const qs = p.toString()
  return `/admin/media${qs ? `?${qs}` : ''}`
}

// ─── Thumbnail component ──────────────────────────────────────────────────────
function AssetThumb({ asset, size = 'md' }: { asset: MediaAsset; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-full h-56' : 'w-full aspect-square'
  const thumbSrc = asset.thumb_url ?? asset.url

  if (asset.file_type === 'image' || isImage(asset.mime_type)) {
    return (
      <div className={`relative ${cls} bg-gray-100 rounded-lg overflow-hidden`}>
        <Image
          src={thumbSrc}
          alt={asset.alt_text ?? asset.file_name}
          fill
          className="object-cover"
          unoptimized
          sizes={size === 'sm' ? '48px' : size === 'lg' ? '600px' : '200px'}
        />
      </div>
    )
  }
  return (
    <div className={`${cls} bg-red-50 rounded-lg flex items-center justify-center`}>
      <FileText className={size === 'sm' ? 'w-5 h-5' : 'w-10 h-10'} color="#ef4444" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MediaManager({
  initialItems, initialTotal, folder, fileType, page, q, tag, perPage,
}: Props) {
  const router = useRouter()
  const [items,    setItems]    = useState<MediaAsset[]>(initialItems)
  const [total,    setTotal]    = useState(initialTotal)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Upload
  const [showUpload,   setShowUpload]   = useState(false)
  const [uploadFolder, setUploadFolder] = useState<string>((folder !== 'all' ? folder : 'general'))
  const [uploadAlt,    setUploadAlt]    = useState('')
  const [uploadTags,   setUploadTags]   = useState('')
  const [uploadDesc,   setUploadDesc]   = useState('')
  const [entries,      setEntries]      = useState<UploadEntry[]>([])
  const [isUploading,  setIsUploading]  = useState(false)
  const [uploadError,  setUploadError]  = useState<string | null>(null)
  const [dragOver,     setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detail / edit
  const [detailAsset,  setDetailAsset]  = useState<MediaAsset | null>(null)
  const [editTitle,    setEditTitle]    = useState('')
  const [editAlt,      setEditAlt]      = useState('')
  const [editDesc,     setEditDesc]     = useState('')
  const [editFolder,   setEditFolder]   = useState('')
  const [editTags,     setEditTags]     = useState('')
  const [usages,       setUsages]       = useState<AssetUsage[] | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [isPending,    startTransition] = useTransition()

  // Delete
  const [deleteId,     setDeleteId]     = useState<string | null>(null)
  const [deleteUsages, setDeleteUsages] = useState<AssetUsage[] | null>(null)
  const [bulkConfirm,  setBulkConfirm]  = useState(false)

  // Preview
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  // ─── Selection ──────────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function selectAll()  { setSelected(new Set(items.map((i) => i.id))) }
  function clearSelect() { setSelected(new Set()) }

  // ─── Copy URL ────────────────────────────────────────────────────────────────
  async function copyUrl(asset: MediaAsset) {
    await navigator.clipboard.writeText(asset.url)
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ─── File picking + compression ───────────────────────────────────────────
  const handleFilePick = useCallback(async (raw: FileList | null) => {
    if (!raw) return
    setUploadError(null)
    const newEntries: UploadEntry[] = []

    for (const f of Array.from(raw)) {
      const entry: UploadEntry = {
        file:         f,
        thumbFile:    null,
        title:        f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        status:       'compressing',
        originalSize: f.size,
      }
      newEntries.push(entry)
    }

    setEntries(newEntries)

    // Compress images in background and update entries
    const updated = await Promise.all(
      newEntries.map(async (entry) => {
        if (!entry.file.type.startsWith('image/')) {
          return { ...entry, status: 'pending' as const }
        }
        try {
          const variants = await generateVariants(entry.file)
          return {
            ...entry,
            file:            variants.full,
            thumbFile:       variants.thumb,
            compressedSize:  variants.full.size,
            status:          'pending' as const,
          }
        } catch {
          return { ...entry, status: 'pending' as const }
        }
      })
    )
    setEntries(updated)
  }, [])

  // ─── Upload ──────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!entries.length) return
    setIsUploading(true)
    setUploadError(null)

    const uploaded: MediaAsset[] = []
    let errorMsg: string | null = null

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, status: 'uploading' } : e))

      const fd = new FormData()
      fd.append('file',        entry.file)
      if (entry.thumbFile) fd.append('thumb_file', entry.thumbFile)
      fd.append('folder',      uploadFolder)
      fd.append('alt_text',    uploadAlt)
      fd.append('title',       entry.title)
      fd.append('description', uploadDesc)
      fd.append('tags',        uploadTags)

      const res = await uploadMediaAsset(fd)

      if (res.error) {
        setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, status: 'error', error: res.error! } : e))
        errorMsg = res.error
        break
      }

      setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, status: 'done' } : e))
      if (res.asset) uploaded.push(res.asset as MediaAsset)
    }

    setIsUploading(false)

    if (errorMsg && uploaded.length === 0) {
      setUploadError(errorMsg)
      return
    }

    setItems((prev) => [...uploaded.reverse(), ...prev])
    setTotal((t) => t + uploaded.length)
    setEntries([])
    setUploadAlt('')
    setUploadTags('')
    setUploadDesc('')
    setShowUpload(false)
    showToast('success', `${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`)
    router.refresh()
  }

  // ─── Detail / Edit ───────────────────────────────────────────────────────────
  function openDetail(asset: MediaAsset) {
    setDetailAsset(asset)
    setEditTitle(asset.title ?? '')
    setEditAlt(asset.alt_text ?? '')
    setEditDesc(asset.description ?? '')
    setEditFolder(asset.folder)
    setEditTags((asset.tags ?? []).join(', '))
    setUsages(null)
  }

  async function loadUsage() {
    if (!detailAsset) return
    setLoadingUsage(true)
    const res = await getAssetUsage(detailAsset.id)
    setUsages(res.usages)
    setLoadingUsage(false)
  }

  function handleSaveEdit() {
    if (!detailAsset) return
    const tags = editTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    startTransition(async () => {
      const res = await updateMediaAsset(detailAsset.id, {
        title:       editTitle,
        alt_text:    editAlt,
        description: editDesc,
        folder:      editFolder,
        tags,
      })
      if (res.error) { showToast('error', res.error); return }
      setItems((prev) => prev.map((i) =>
        i.id === detailAsset.id
          ? { ...i, title: editTitle || null, alt_text: editAlt || null, description: editDesc || null, folder: editFolder, tags }
          : i
      ))
      setDetailAsset(null)
      showToast('success', 'Asset updated')
    })
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  async function openDelete(id: string) {
    setDeleteId(id)
    setDeleteUsages(null)
    const res = await getAssetUsage(id)
    setDeleteUsages(res.usages)
  }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const res = await deleteMediaAsset(deleteId)
      if (res.error) { showToast('error', res.error); setDeleteId(null); return }
      setItems((prev) => prev.filter((i) => i.id !== deleteId))
      setTotal((t) => t - 1)
      setSelected((prev) => { const n = new Set(prev); n.delete(deleteId); return n })
      if (detailAsset?.id === deleteId) setDetailAsset(null)
      setDeleteId(null)
      showToast('success', 'Asset deleted')
    })
  }

  function handleBulkDelete() {
    const ids = Array.from(selected)
    startTransition(async () => {
      const res = await bulkDeleteMediaAssets(ids)
      if (res.error) { showToast('error', res.error); setBulkConfirm(false); return }
      setItems((prev) => prev.filter((i) => !selected.has(i.id)))
      setTotal((t) => t - ids.length)
      setSelected(new Set())
      setBulkConfirm(false)
      showToast('success', `${ids.length} items deleted`)
    })
  }

  const totalPages = Math.ceil(total / perPage)

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-right ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total.toLocaleString()} {total === 1 ? 'asset' : 'assets'}
            {selected.size > 0 && <span className="text-primary-600"> · {selected.size} selected</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <>
              <button
                onClick={() => setBulkConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete ({selected.size})
              </button>
              <button onClick={clearSelect} className="text-sm text-slate-400 hover:text-slate-600 font-medium">
                Clear
              </button>
            </>
          )}
          <button
            onClick={() => setViewMode((v) => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-lg bg-gray-100 text-slate-600 hover:bg-gray-200 transition-colors"
            title="Toggle view"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
          <a
            href="/api/admin/cleanup/media"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
            title="Find and delete unused files"
          >
            <RefreshCw className="w-4 h-4" /> Cleanup
          </a>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Folder tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((f) => (
            <a
              key={f.value}
              href={buildUrl({ folder: f.value, fileType, page: 1, q, tag })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                folder === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}
            >
              <span>{f.emoji}</span> {f.label}
            </a>
          ))}
        </div>

        {/* Type toggle + search + tag filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type toggle */}
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {TYPE_TABS.map((t) => (
              <a
                key={t.value}
                href={buildUrl({ folder, fileType: t.value, page: 1, q, tag })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  fileType === t.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </a>
            ))}
          </div>

          {/* Search */}
          <form method="get" action="/admin/media" className="flex items-center gap-2">
            {folder   !== 'all' && <input type="hidden" name="folder"  value={folder} />}
            {fileType !== 'all' && <input type="hidden" name="type"    value={fileType} />}
            {tag                && <input type="hidden" name="tag"     value={tag} />}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search files…"
                className="input pl-9 text-sm w-52"
              />
            </div>
            <button type="submit" className="btn-secondary text-sm py-2">Go</button>
            {q && (
              <a
                href={buildUrl({ folder, fileType, page: 1, q: '', tag })}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </a>
            )}
          </form>

          {/* Active tag chip */}
          {tag && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
              <Tag className="w-3.5 h-3.5" /> #{tag}
              <a href={buildUrl({ folder, fileType, page: 1, q, tag: '' })} className="ml-1 hover:text-primary-900">
                <X className="w-3 h-3" />
              </a>
            </span>
          )}
        </div>
      </div>

      {/* ── Bulk select bar ────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={selected.size === items.length && items.length > 0}
            onChange={() => selected.size === items.length ? clearSelect() : selectAll()}
            className="rounded w-4 h-4"
          />
          <button
            onClick={() => selected.size === items.length ? clearSelect() : selectAll()}
            className="text-slate-500 hover:text-slate-700 font-medium"
          >
            {selected.size === items.length ? 'Deselect all' : 'Select all on page'}
          </button>
        </div>
      )}

      {/* ── Grid / List / Empty ────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="card p-16 text-center space-y-4">
          <ImageIcon className="w-14 h-14 text-slate-200 mx-auto" />
          <div>
            <p className="text-slate-600 font-semibold text-lg">
              {q ? `No results for "${q}"` : folder !== 'all' ? `No files in ${folder}` : 'No media yet'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {q
                ? 'Try a different search term or clear the filter'
                : 'Upload images and documents from your device — they appear here instantly'}
            </p>
          </div>
          {!q && (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary inline-flex items-center gap-2 mx-auto"
            >
              <Upload className="w-4 h-4" /> Upload Files
            </button>
          )}
          {q && (
            <a
              href={buildUrl({ folder, fileType, page: 1, q: '', tag })}
              className="btn-secondary inline-flex items-center gap-2 mx-auto text-sm"
            >
              <X className="w-4 h-4" /> Clear search
            </a>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((asset) => (
            <div
              key={asset.id}
              className={`group relative rounded-xl border-2 transition-all overflow-hidden bg-white ${
                selected.has(asset.id)
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-transparent hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              {/* Thumbnail */}
              <div className="cursor-pointer" onClick={() => openDetail(asset)}>
                <AssetThumb asset={asset} />
              </div>

              {/* Card info */}
              <div className="p-1.5">
                <p className="text-[10px] font-semibold text-slate-700 truncate">
                  {asset.title ?? asset.file_name}
                </p>
                {(asset.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {(asset.tags ?? []).slice(0, 2).map((t) => (
                      <a
                        key={t}
                        href={buildUrl({ folder, fileType, page: 1, q, tag: t })}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] px-1 py-0.5 rounded bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium"
                      >
                        #{t}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex flex-col justify-between p-1.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center justify-between">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id) }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected.has(asset.id)
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-white/80 border-white hover:bg-white'
                    }`}
                  >
                    {selected.has(asset.id) && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); void copyUrl(asset) }}
                      title="Copy URL"
                      className="p-1 rounded-md bg-white/90 text-slate-700 hover:bg-white transition-colors"
                    >
                      {copiedId === asset.id ? <CheckCheck className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {isImage(asset.file_type) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset) }}
                        title="Preview"
                        className="p-1 rounded-md bg-white/90 text-slate-700 hover:bg-white transition-colors"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); void openDelete(asset.id) }}
                      title="Delete"
                      className="p-1 rounded-md bg-white/90 text-red-600 hover:bg-white transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="text-white text-[9px] font-medium drop-shadow truncate">
                  {formatBytes(asset.file_size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={() => selected.size === items.length ? clearSelect() : selectAll()}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left w-14">Preview</th>
                  <th className="px-4 py-3 text-left">Title / File</th>
                  <th className="px-4 py-3 text-left">Tags</th>
                  <th className="px-4 py-3 text-left">Section</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(asset.id)}
                        onChange={() => toggleSelect(asset.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <AssetThumb asset={asset} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(asset)}
                        className="text-left hover:text-primary-600"
                      >
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                          {asset.title ?? asset.file_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{asset.file_name}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(asset.tags ?? []).slice(0, 3).map((t) => (
                          <a
                            key={t}
                            href={buildUrl({ folder, fileType, page: 1, q, tag: t })}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium"
                          >
                            #{t}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-gray text-xs capitalize">{asset.folder}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatBytes(asset.file_size)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(asset.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => void copyUrl(asset)} title="Copy URL" className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors">
                          {copiedId === asset.id ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a href={asset.url} target="_blank" rel="noopener noreferrer" title="Open" className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => openDetail(asset)} title="Edit" className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => void openDelete(asset.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <a
            href={buildUrl({ folder, fileType, page: Math.max(1, page - 1), q, tag })}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              page <= 1 ? 'opacity-40 pointer-events-none bg-gray-100 text-slate-400' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </a>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i)
            if (pg < 1 || pg > totalPages) return null
            return (
              <a
                key={pg}
                href={buildUrl({ folder, fileType, page: pg, q, tag })}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  pg === page ? 'bg-primary-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {pg}
              </a>
            )
          })}
          <a
            href={buildUrl({ folder, fileType, page: Math.min(totalPages, page + 1), q, tag })}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              page >= totalPages ? 'opacity-40 pointer-events-none bg-gray-100 text-slate-400' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            }`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════════════════════════════ */}

      {/* ── Upload Modal ───────────────────────────────────────────────────── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">Upload Media</h2>
              <button onClick={() => { setShowUpload(false); setEntries([]) }} className="p-2 rounded-lg text-slate-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); void handleFilePick(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium text-sm">
                  Drop files here or click to browse
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  JPG, PNG, WebP (max 2 MB after compression) · PDF (max 20 MB)
                </p>
                <p className="text-primary-600 text-xs mt-1 font-medium">
                  ✓ Images auto-compressed to WebP · thumbnails generated
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,.pdf"
                  className="hidden"
                  onChange={(e) => { void handleFilePick(e.target.files) }}
                />
              </div>

              {/* File queue */}
              {entries.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {entries.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{entry.file.name}</p>
                        <p className="text-xs text-slate-400">
                          {entry.status === 'compressing' && '⏳ Compressing…'}
                          {entry.status === 'uploading'   && '⬆️ Uploading…'}
                          {entry.status === 'done'        && '✅ Done'}
                          {entry.status === 'error'       && `❌ ${entry.error}`}
                          {entry.status === 'pending' && entry.compressedSize && entry.compressedSize < entry.originalSize
                            ? `${formatBytes(entry.originalSize)} → ${formatBytes(entry.compressedSize)}`
                            : entry.status === 'pending'
                            ? formatBytes(entry.originalSize)
                            : ''}
                        </p>
                      </div>
                      {(entry.status === 'compressing' || entry.status === 'uploading') && (
                        <Loader2 className="w-4 h-4 text-primary-500 animate-spin shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Folder */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Section / Folder</label>
                  <select
                    className="input text-sm"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                  >
                    {UPLOAD_FOLDERS.map((f) => (
                      <option key={f.value} value={f.value}>{f.emoji} {f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Alt text (images)</label>
                  <input
                    className="input text-sm"
                    placeholder="Describe for accessibility"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  className="input text-sm"
                  placeholder="team, kenya, youth"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input text-sm resize-none"
                  rows={2}
                  placeholder="Context about this file…"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                />
              </div>

              {uploadError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => void handleUpload()}
                disabled={!entries.length || isUploading || entries.some((e) => e.status === 'compressing')}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploading
                  ? 'Uploading…'
                  : entries.some((e) => e.status === 'compressing')
                  ? 'Compressing…'
                  : `Upload ${entries.length ? `(${entries.length})` : ''}`}
              </button>
              <button onClick={() => { setShowUpload(false); setEntries([]) }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / Edit Modal ────────────────────────────────────────────── */}
      {detailAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-900">Asset Details</h2>
              <button onClick={() => setDetailAsset(null)} className="p-2 rounded-lg text-slate-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Preview */}
              {isImage(detailAsset.file_type) ? (
                <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={detailAsset.url} alt={detailAsset.alt_text ?? ''} fill className="object-contain" unoptimized />
                  <button
                    onClick={() => setPreviewAsset(detailAsset)}
                    className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-lg text-slate-700 hover:bg-white text-xs font-medium flex items-center gap-1"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> Full size
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl bg-red-50 flex flex-col items-center justify-center gap-2">
                  <FileText className="w-10 h-10 text-red-400" />
                  <p className="text-sm font-medium text-red-600">PDF Document</p>
                </div>
              )}

              {/* File info */}
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span className="truncate font-medium text-slate-700">{detailAsset.file_name}</span>
                <span className="shrink-0 ml-2">{formatBytes(detailAsset.file_size)}</span>
              </div>

              {/* Copy URL */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <input
                  readOnly
                  value={detailAsset.url}
                  className="flex-1 text-xs text-slate-500 bg-transparent outline-none truncate"
                />
                <button
                  onClick={() => void copyUrl(detailAsset)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy URL"
                >
                  {copiedId === detailAsset.id
                    ? <CheckCheck className="w-4 h-4 text-green-600" />
                    : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
                <a
                  href={detailAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
              </div>

              {/* Edit fields */}
              <div className="space-y-3">
                <div>
                  <label className="label">Title</label>
                  <input
                    className="input text-sm"
                    placeholder="Display title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Alt text</label>
                  <input
                    className="input text-sm"
                    placeholder="Describe the image"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input text-sm resize-none"
                    rows={2}
                    placeholder="Additional context…"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Section / Folder</label>
                    <select
                      className="input text-sm"
                      value={editFolder}
                      onChange={(e) => setEditFolder(e.target.value)}
                    >
                      {UPLOAD_FOLDERS.map((f) => (
                        <option key={f.value} value={f.value}>{f.emoji} {f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</label>
                    <input
                      className="input text-sm"
                      placeholder="tag1, tag2"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Usage info */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Used in
                  </p>
                  {!usages && (
                    <button
                      onClick={() => void loadUsage()}
                      disabled={loadingUsage}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      {loadingUsage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                      Check usage
                    </button>
                  )}
                </div>
                {usages === null && !loadingUsage && (
                  <p className="text-xs text-slate-400">Click &quot;Check usage&quot; to see where this file is referenced</p>
                )}
                {loadingUsage && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking…
                  </div>
                )}
                {usages !== null && usages.length === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    ⚠️ Not used anywhere — safe to delete or it may be orphaned
                  </p>
                )}
                {usages !== null && usages.length > 0 && (
                  <div className="space-y-1">
                    {usages.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-3 py-1.5 bg-green-50 rounded-lg">
                        <span className="font-semibold text-green-700">{u.type}</span>
                        <span className="text-green-600 truncate">{u.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white flex gap-3 p-6 pt-4 border-t border-gray-100 rounded-b-2xl">
              <button
                onClick={handleSaveEdit}
                disabled={isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => void openDelete(detailAsset.id)}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setDetailAsset(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete this asset?</h3>
                <p className="text-sm text-slate-500">This cannot be undone.</p>
              </div>
            </div>

            {deleteUsages === null && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking usage…
              </div>
            )}
            {deleteUsages !== null && deleteUsages.length > 0 && (
              <div className="p-3 bg-red-50 rounded-xl space-y-1">
                <p className="text-sm font-semibold text-red-700">⚠️ Still in use:</p>
                {deleteUsages.map((u, i) => (
                  <p key={i} className="text-xs text-red-600">{u.type}: {u.label}</p>
                ))}
                <p className="text-xs text-red-500 mt-1">Deleting will break these references.</p>
              </div>
            )}
            {deleteUsages !== null && deleteUsages.length === 0 && (
              <p className="text-sm text-slate-500 bg-gray-50 rounded-xl px-3 py-2">
                ✅ Not referenced anywhere — safe to delete.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isPending || deleteUsages === null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
              <button
                onClick={() => { setDeleteId(null); setDeleteUsages(null) }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirm ────────────────────────────────────────────── */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete {selected.size} items?</h3>
                <p className="text-sm text-slate-500">Files will be permanently removed from storage.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Delete all
              </button>
              <button onClick={() => setBulkConfirm(false)} className="flex-1 btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal (fullscreen image) ─────────────────────────────── */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <button
            onClick={() => setPreviewAsset(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={previewAsset.url}
              alt={previewAsset.alt_text ?? previewAsset.file_name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center">
            {previewAsset.title ?? previewAsset.file_name} · {formatBytes(previewAsset.file_size)}
          </div>
        </div>
      )}
    </div>
  )
}
