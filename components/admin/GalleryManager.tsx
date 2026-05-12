'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, Edit2, X, Check, Loader2,
  Eye, EyeOff, ImageIcon, Upload, Layers, FolderOpen, Search, CheckSquare, Square,
} from 'lucide-react'
import { saveGalleryItem, deleteGalleryItem, toggleGalleryItem, uploadImage, reorderGalleryItems, bulkDeleteGalleryItems } from '@/app/actions/admin'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'

export type GalleryItem = {
  id: string
  title: string
  description: string | null
  image_url: string
  category: string | null
  event_name: string | null
  taken_at: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

interface Props {
  initialItems: GalleryItem[]
}

const PRESET_CATEGORIES = ['Community Events', 'Health', 'Education', 'Environment', 'Economic Empowerment', 'Celebrations', 'Volunteers']

function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggle,
  pending,
}: {
  item: GalleryItem
  onEdit: (i: GalleryItem) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
  pending: boolean
}) {
  return (
    <div className={`relative bg-white rounded-xl border shadow-sm overflow-hidden group transition-opacity ${!item.is_active ? 'opacity-60' : ''}`}>
      <div className="relative h-44 bg-slate-100">
        <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized />
        {!item.is_active && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">Hidden</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-slate-800 text-sm line-clamp-1">{item.title}</p>
        {item.event_name && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.event_name}</p>}
        {item.category && (
          <span className="inline-block mt-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
        )}
      </div>
      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(item.id, !item.is_active)}
          disabled={pending}
          title={item.is_active ? 'Hide from gallery' : 'Show in gallery'}
          className="p-1.5 rounded-lg bg-white/90 shadow text-slate-600 hover:text-primary-600"
        >
          {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg bg-white/90 shadow text-slate-600 hover:text-blue-600"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={pending}
          className="p-1.5 rounded-lg bg-white/90 shadow text-slate-600 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function GalleryManager({ initialItems }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)
  const bulkFileRef = useRef<HTMLInputElement>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)

  // Photo source tab: 'upload' | 'bulk' | 'library'
  const [sourceTab, setSourceTab] = useState<'upload' | 'bulk' | 'library'>('upload')

  // Bulk upload state
  type BulkEntry = { file: File; preview: string; title: string }
  const [bulkEntries, setBulkEntries] = useState<BulkEntry[]>([])
  const [bulkProgress, setBulkProgress] = useState<string | null>(null)

  // Media library state
  type LibraryAsset = { id: string; url: string; thumb_url: string | null; file_name: string; title: string | null }
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')

  // Form state (single / library pick)
  const [form, setForm] = useState({
    title: '', description: '', image_url: '',
    category: '', event_name: '', taken_at: '',
    sort_order: '0', is_active: true,
  })
  // Shared metadata for bulk upload
  const [bulkMeta, setBulkMeta] = useState({
    description: '', category: '', event_name: '', taken_at: '', sort_order: '0', is_active: true,
  })

  const resetForm = () => {
    setForm({ title: '', description: '', image_url: '', category: '', event_name: '', taken_at: '', sort_order: '0', is_active: true })
    setPreviewUrl('')
    setEditing(null)
    setError(null)
    setBulkEntries([])
    setBulkProgress(null)
    setLibrarySearch('')
    setSourceTab('upload')
  }

  const openAdd = () => { resetForm(); setShowForm(true) }

  const openEdit = (item: GalleryItem) => {
    setEditing(item)
    setForm({
      title:       item.title,
      description: item.description ?? '',
      image_url:   item.image_url,
      category:    item.category ?? '',
      event_name:  item.event_name ?? '',
      taken_at:    item.taken_at ?? '',
      sort_order:  String(item.sort_order),
      is_active:   item.is_active,
    })
    setPreviewUrl(item.image_url)
    setSourceTab('upload')
    setShowForm(true)
  }

  // Load media library assets
  const loadLibrary = async () => {
    setLibraryLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('media_assets')
      .select('id, url, thumb_url, file_name, title')
      .eq('file_type', 'image')
      .order('created_at', { ascending: false })
      .limit(120)
    setLibraryAssets((data as LibraryAsset[]) ?? [])
    setLibraryLoading(false)
  }

  useEffect(() => {
    if (sourceTab === 'library' && libraryAssets.length === 0) loadLibrary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTab])

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    // Compress before uploading
    const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 })
    const fd = new FormData()
    fd.append('file', compressed)
    const res = await uploadImage(fd, 'gallery')
    setUploading(false)
    if (res.error) { setError(res.error); return }
    setForm((f) => ({ ...f, image_url: res.url!, title: f.title || file.name.replace(/\.[^.]+$/, '') }))
    setPreviewUrl(res.url!)
  }

  // Bulk: add files
  const handleBulkFilesSelected = (files: FileList | null) => {
    if (!files) return
    const newEntries: BulkEntry[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    }))
    setBulkEntries((prev) => [...prev, ...newEntries])
  }

  // Bulk: submit all files
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkEntries.length === 0) { setError('No files selected'); return }
    setError(null)
    setBulkProgress(`Uploading 1 of ${bulkEntries.length}…`)
    let done = 0
    for (const entry of bulkEntries) {
      setBulkProgress(`Uploading ${done + 1} of ${bulkEntries.length}: ${entry.title}`)
      const fd = new FormData()
      const compressed = await compressImage(entry.file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 })
      fd.append('file', compressed)
      const upRes = await uploadImage(fd, 'gallery')
      if (upRes.error) {
        setError(`Failed on "${entry.title}": ${upRes.error}`)
        setBulkProgress(null)
        return
      }
      const saveFd = new FormData()
      saveFd.append('title',       entry.title || entry.file.name)
      saveFd.append('description', bulkMeta.description)
      saveFd.append('image_url',   upRes.url!)
      saveFd.append('category',    bulkMeta.category)
      saveFd.append('event_name',  bulkMeta.event_name)
      saveFd.append('taken_at',    bulkMeta.taken_at)
      saveFd.append('sort_order',  bulkMeta.sort_order)
      saveFd.append('is_active',   String(bulkMeta.is_active))
      const saveRes = await saveGalleryItem(saveFd)
      if (saveRes?.error) {
        setError(`Saved image but failed DB entry for "${entry.title}": ${saveRes.error}`)
        setBulkProgress(null)
        return
      }
      done++
    }
    setSuccess(`${done} photo${done !== 1 ? 's' : ''} added to gallery.`)
    setShowForm(false)
    resetForm()
    router.refresh()
    setTimeout(() => setSuccess(null), 4000)
  }

  // Single / library submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    startTransition(async () => {
      const res = await saveGalleryItem(fd, editing?.id)
      if (res?.error) { setError(res.error); return }
      setSuccess(editing ? 'Photo updated.' : 'Photo added to gallery.')
      setShowForm(false)
      resetForm()
      router.refresh()
      setTimeout(() => setSuccess(null), 3000)
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this photo from the gallery?')) return
    startTransition(async () => {
      const res = await deleteGalleryItem(id)
      if (res?.error) { setError(res.error); return }
      setItems((prev) => prev.filter((i) => i.id !== id))
    })
  }

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      const res = await toggleGalleryItem(id, active)
      if (res?.error) { setError(res.error); return }
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_active: active } : i))
    })
  }

  const handleReorder = async (orderedIds: string[]) => {
    const res = await reorderGalleryItems(orderedIds)
    if (res?.error) setError(res.error)
    // Update local order
    const map = new Map(items.map((i) => [i.id, i]))
    setItems(orderedIds.map((id) => map.get(id)!).filter(Boolean))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected photo${selectedIds.size !== 1 ? 's' : ''}?`)) return
    startTransition(async () => {
      const res = await bulkDeleteGalleryItems(Array.from(selectedIds))
      if (res?.error) { setError(res.error); return }
      setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)))
      setSelectedIds(new Set())
      setBulkMode(false)
      setSuccess(`${res.deleted} photo${res.deleted !== 1 ? 's' : ''} deleted.`)
      setTimeout(() => setSuccess(null), 3000)
    })
  }

  const filteredLibrary = libraryAssets.filter((a) =>
    !librarySearch ||
    (a.title ?? a.file_name).toLowerCase().includes(librarySearch.toLowerCase())
  )

  // Shared metadata fields (used by both single form and bulk form)
  const MetaFields = ({ vals, onChange }: {
    vals: { description: string; category: string; event_name: string; taken_at: string; sort_order: string; is_active: boolean }
    onChange: (k: string, v: string | boolean) => void
  }) => (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea rows={2} value={vals.description} onChange={(e) => onChange('description', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Brief description…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input list="gallery-categories" value={vals.category} onChange={(e) => onChange('category', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Select or type…" />
          <datalist id="gallery-categories">
            {PRESET_CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
          <input value={vals.event_name} onChange={(e) => onChange('event_name', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Annual Health Drive" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date Taken</label>
          <input type="date" value={vals.taken_at} onChange={(e) => onChange('taken_at', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
          <input type="number" min={0} value={vals.sort_order} onChange={(e) => onChange('sort_order', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={vals.is_active} onChange={(e) => onChange('is_active', e.target.checked)}
          className="w-4 h-4 rounded text-primary-600" />
        <span className="text-sm text-slate-700">Visible on public gallery</span>
      </label>
    </>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gallery</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} photo{items.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          {bulkMode ? (
            <>
              <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isPending}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
              >
                Delete Selected
              </button>
              <button
                onClick={() => { setBulkMode(false); setSelectedIds(new Set()) }}
                className="px-3 py-1.5 rounded-lg border text-slate-600 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {items.length > 0 && (
                <button
                  onClick={() => setBulkMode(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
                >
                  Bulk Select
                </button>
              )}
              <button onClick={openAdd} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Photo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          <button className="ml-auto" onClick={() => setError(null)}><X className="w-3 h-3" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); resetForm() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-slate-900">{editing ? 'Edit Photo' : 'Add Photo'}</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source tabs (hidden when editing) */}
            {!editing && (
              <div className="flex border-b">
                {([
                  { id: 'upload',  label: 'Upload File',    Icon: Upload },
                  { id: 'bulk',    label: 'Bulk Upload',    Icon: Layers },
                  { id: 'library', label: 'Media Library',  Icon: FolderOpen },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSourceTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                      sourceTab === id
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── UPLOAD TAB / EDIT ── */}
            {(sourceTab === 'upload' || editing) && (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Photo *</label>
                  {previewUrl ? (
                    <div className="relative mb-2">
                      <Image src={previewUrl} alt="Preview" width={600} height={300} className="w-full h-48 object-cover rounded-lg" unoptimized />
                      <button type="button" onClick={() => { setPreviewUrl(''); setForm((f) => ({ ...f, image_url: '' })) }}
                        className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow text-slate-600 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
                      onClick={() => fileRef.current?.click()}>
                      {uploading ? <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" /> : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Click to upload or paste URL below</p>
                        </>
                      )}
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                  <input type="url" placeholder="Or paste image URL…" value={form.image_url}
                    onChange={(e) => { setForm((f) => ({ ...f, image_url: e.target.value })); setPreviewUrl(e.target.value) }}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Health Camp 2025" />
                </div>
                <MetaFields
                  vals={form}
                  onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                    className="px-4 py-2 rounded-lg border text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={isPending || uploading || !form.image_url}
                    className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editing ? 'Save Changes' : 'Add to Gallery'}
                  </button>
                </div>
              </form>
            )}

            {/* ── BULK UPLOAD TAB ── */}
            {sourceTab === 'bulk' && !editing && (
              <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
                {/* File picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Select Photos <span className="text-slate-400 font-normal">(multiple allowed)</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
                    onClick={() => bulkFileRef.current?.click()}>
                    <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to select multiple files</p>
                    <p className="text-xs text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                  <input ref={bulkFileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handleBulkFilesSelected(e.target.files)} />
                </div>

                {/* Preview grid with individual titles */}
                {bulkEntries.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700">{bulkEntries.length} photo{bulkEntries.length !== 1 ? 's' : ''} selected</p>
                      <button type="button" onClick={() => setBulkEntries([])}
                        className="text-xs text-red-500 hover:text-red-700">Clear all</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                      {bulkEntries.map((entry, i) => (
                        <div key={i} className="relative group">
                          <img src={entry.preview} alt="" className="w-full h-24 object-cover rounded-lg bg-slate-100" />
                          <button type="button"
                            onClick={() => setBulkEntries((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                          <input
                            value={entry.title}
                            onChange={(e) => setBulkEntries((prev) => prev.map((en, j) => j === i ? { ...en, title: e.target.value } : en))}
                            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Photo title…"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared metadata */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Shared Information (applies to all photos)
                  </p>
                  <MetaFields
                    vals={bulkMeta}
                    onChange={(k, v) => setBulkMeta((m) => ({ ...m, [k]: v }))}
                  />
                </div>

                {bulkProgress && (
                  <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> {bulkProgress}
                  </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                    className="px-4 py-2 rounded-lg border text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={bulkEntries.length === 0 || !!bulkProgress}
                    className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                    {bulkProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload {bulkEntries.length > 0 ? `${bulkEntries.length} Photo${bulkEntries.length !== 1 ? 's' : ''}` : 'Photos'}
                  </button>
                </div>
              </form>
            )}

            {/* ── MEDIA LIBRARY TAB ── */}
            {sourceTab === 'library' && !editing && (
              <div className="p-5 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Search media library…"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {libraryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  </div>
                ) : filteredLibrary.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No images found in media library.</p>
                    <button onClick={loadLibrary} className="text-xs text-primary-600 hover:underline mt-1">Refresh</button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-400">{filteredLibrary.length} image{filteredLibrary.length !== 1 ? 's' : ''} — click one to use it</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                      {filteredLibrary.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              image_url: asset.url,
                              title: f.title || asset.title || asset.file_name.replace(/\.[^.]+$/, ''),
                            }))
                            setPreviewUrl(asset.url)
                            setSourceTab('upload') // switch to upload tab to fill in metadata
                          }}
                          className="relative group aspect-square overflow-hidden rounded-lg bg-slate-100 border-2 border-transparent hover:border-primary-500 transition-all"
                          title={asset.title ?? asset.file_name}
                        >
                          <img
                            src={asset.thumb_url ?? asset.url}
                            alt={asset.title ?? asset.file_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/20 transition-colors flex items-center justify-center">
                            <Check className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-600">No gallery photos yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-5">Upload photos from events and activities.</p>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-1" /> Add First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {bulkMode && (
                <button
                  onClick={() => toggleSelect(item.id)}
                  className="absolute top-2 left-2 z-10"
                  aria-label={selectedIds.has(item.id) ? 'Deselect' : 'Select'}
                >
                  {selectedIds.has(item.id)
                    ? <CheckSquare className="w-5 h-5 text-primary-600 drop-shadow" />
                    : <Square className="w-5 h-5 text-white drop-shadow" />}
                </button>
              )}
              <ItemCard
                item={item}
                onEdit={bulkMode ? () => {} : openEdit}
                onDelete={bulkMode ? () => {} : handleDelete}
                onToggle={bulkMode ? () => {} : handleToggle}
                pending={isPending}
              />
            </div>
          ))}
        </div>
      )}
          <p className="text-slate-400 text-sm mt-1 mb-5">Upload photos from events and activities.</p>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-1" /> Add First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {bulkMode && (
                <button
                  onClick={() => toggleSelect(item.id)}
                  className="absolute top-2 left-2 z-10"
                  aria-label={selectedIds.has(item.id) ? 'Deselect' : 'Select'}
                >
                  {selectedIds.has(item.id)
                    ? <CheckSquare className="w-5 h-5 text-primary-600 drop-shadow" />
                    : <Square className="w-5 h-5 text-white drop-shadow" />}
                </button>
              )}
              <ItemCard
                item={item}
                onEdit={bulkMode ? () => {} : openEdit}
                onDelete={bulkMode ? () => {} : handleDelete}
                onToggle={bulkMode ? () => {} : handleToggle}
                pending={isPending}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
