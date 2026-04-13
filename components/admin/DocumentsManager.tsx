'use client'

import { useState, useTransition } from 'react'
import {
  FileText, Plus, Edit2, Trash2, Download, Save, X,
  Loader2, CheckCircle2, AlertCircle, BookOpen, FileBarChart,
  Shield, BookMarked, FolderOpen,
} from 'lucide-react'
import { saveDocument, deleteDocument, uploadDocument } from '@/app/actions/admin'

type Doc = {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string | null
  file_size: number | null
  category: string
  version: string | null
  is_public: boolean
  created_at: string
}

const CATEGORY_OPTIONS = [
  { value: 'constitution', label: 'Constitution', icon: BookOpen },
  { value: 'report',       label: 'Report',       icon: FileBarChart },
  { value: 'policy',       label: 'Policy',       icon: Shield },
  { value: 'guide',        label: 'Guide',        icon: BookMarked },
  { value: 'general',      label: 'General',      icon: FolderOpen },
]

const CATEGORY_COLORS: Record<string, string> = {
  constitution: 'bg-purple-100 text-purple-800',
  report:       'bg-blue-100 text-blue-800',
  policy:       'bg-orange-100 text-orange-800',
  guide:        'bg-green-100 text-green-800',
  general:      'bg-gray-100 text-gray-700',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ToastMsg = { type: 'success' | 'error'; text: string }

export default function DocumentsManager({ documents: initial }: { documents: Doc[] }) {
  const [docs, setDocs] = useState<Doc[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editDoc, setEditDoc] = useState<Doc | null>(null)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', file_url: '', file_name: '', category: 'general', version: '', is_public: true,
  })

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  function openCreate() {
    setEditDoc(null)
    setForm({ title: '', description: '', file_url: '', file_name: '', category: 'general', version: '', is_public: true })
    setShowForm(true)
  }

  function openEdit(doc: Doc) {
    setEditDoc(doc)
    setForm({
      title: doc.title,
      description: doc.description ?? '',
      file_url: doc.file_url,
      file_name: doc.file_name ?? '',
      category: doc.category,
      version: doc.version ?? '',
      is_public: doc.is_public,
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditDoc(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadDocument(fd)
    setUploading(false)
    if ('error' in result && result.error) {
      showToast('error', result.error as string)
    } else if ('url' in result && result.url) {
      setForm((prev) => ({ ...prev, file_url: result.url!, file_name: result.name ?? file.name }))
    }
  }

  function handleSave() {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    startTransition(async () => {
      const result = await saveDocument(fd, editDoc?.id)
      if (result.error) {
        showToast('error', result.error as string)
      } else {
        showToast('success', editDoc ? 'Document updated.' : 'Document added.')
        setShowForm(false)
        const updated: Doc = {
          ...(editDoc ?? { id: Date.now().toString(), created_at: new Date().toISOString() }),
          ...form,
          description: form.description || null,
          file_name: form.file_name || null,
          file_size: editDoc?.file_size ?? null,
          version: form.version || null,
        }
        if (editDoc) {
          setDocs((prev) => prev.map((d) => d.id === editDoc.id ? updated : d))
        } else {
          setDocs((prev) => [updated, ...prev])
        }
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteDocument(id)
      if (result.error) {
        showToast('error', result.error as string)
      } else {
        showToast('success', 'Document deleted.')
        setDocs((prev) => prev.filter((d) => d.id !== id))
      }
      setDeleteConfirmId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents & Constitution</h1>
          <p className="text-slate-500 text-sm mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''} · Members can download public files</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card p-6 border-2 border-primary-200 bg-primary-50/30">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">{editDoc ? 'Edit Document' : 'Add New Document'}</h2>
            <button onClick={cancelForm} className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Foundation Constitution v2.0" />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of this document..." />
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Version</label>
              <input className="input" value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="e.g. v2.1 or 2024" />
            </div>

            <div className="md:col-span-2">
              <label className="label">Upload File</label>
              <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'}`}>
                {uploading ? <Loader2 className="w-5 h-5 text-primary-500 animate-spin" /> : <FileText className="w-5 h-5 text-slate-400" />}
                <span className="text-sm text-slate-500">{uploading ? 'Uploading...' : (form.file_name || 'Click to upload PDF, Word, or Excel (max 20MB)')}</span>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            {form.file_url && (
              <div className="md:col-span-2">
                <label className="label">File URL</label>
                <input className="input text-xs text-slate-500" value={form.file_url} onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))} placeholder="or paste a direct file URL" />
              </div>
            )}

            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <label htmlFor="is_public" className="text-sm text-slate-700">Visible to all members (public document)</label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={isPending || uploading || !form.title || !form.file_url}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editDoc ? 'Update Document' : 'Save Document'}
            </button>
            <button onClick={cancelForm} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        {docs.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm mt-1">Add the foundation constitution or other resources.</p>
          </div>
        )}

        {docs.map((doc) => {
          const CatMeta = CATEGORY_OPTIONS.find((c) => c.value === doc.category)
          const CatIcon = CatMeta?.icon ?? FileText
          return (
            <div key={doc.id} className="card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${CATEGORY_COLORS[doc.category] ?? 'bg-gray-100'}`}>
                <CatIcon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-800 text-sm">{doc.title}</h3>
                  {doc.version && <span className="badge-gray text-xs">{doc.version}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[doc.category] ?? 'bg-gray-100 text-gray-700'}`}>
                    {CatMeta?.label ?? doc.category}
                  </span>
                  {!doc.is_public && <span className="badge-gray text-xs">Private</span>}
                </div>
                {doc.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.description}</p>}
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatBytes(doc.file_size)} · Added {new Date(doc.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => openEdit(doc)}
                  className="p-1.5 rounded-lg bg-gray-100 text-slate-600 hover:bg-gray-200 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {deleteConfirmId === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isPending}
                      className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                    >
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-slate-600">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(doc.id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
