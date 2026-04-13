import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Download, FileText, BookOpen, FileBarChart,
  Shield, BookMarked, FolderOpen, ExternalLink,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Resources & Documents' }

const CATEGORY_META: Record<string, { label: string; Icon: React.FC<{ className?: string }>; color: string }> = {
  constitution: { label: 'Constitution',  Icon: BookOpen,      color: 'bg-purple-100 text-purple-700' },
  report:       { label: 'Report',        Icon: FileBarChart,  color: 'bg-blue-100 text-blue-700' },
  policy:       { label: 'Policy',        Icon: Shield,        color: 'bg-orange-100 text-orange-700' },
  guide:        { label: 'Guide',         Icon: BookMarked,    color: 'bg-green-100 text-green-700' },
  general:      { label: 'General',       Icon: FolderOpen,    color: 'bg-gray-100 text-gray-600' },
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, description, file_url, file_name, file_size, category, version, created_at')
    .eq('is_public', true)
    .order('category')
    .order('created_at', { ascending: false })

  const docs = documents ?? []

  // Group by category
  const grouped: Record<string, typeof docs> = {}
  for (const doc of docs) {
    const cat = doc.category ?? 'general'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(doc)
  }

  const categoryOrder = ['constitution', 'policy', 'guide', 'report', 'general']

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resources & Documents</h1>
        <p className="text-slate-500 text-sm mt-1">
          Foundation documents available for download. {docs.length} document{docs.length !== 1 ? 's' : ''} available.
        </p>
      </div>

      {docs.length === 0 && (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No documents available yet.</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon — the foundation will upload documents here.</p>
        </div>
      )}

      {categoryOrder.filter((cat) => grouped[cat]?.length).map((cat) => {
        const meta = CATEGORY_META[cat] ?? CATEGORY_META.general
        const { Icon } = meta
        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-800">{meta.label}s</h2>
              <span className="text-xs text-slate-400 ml-1">({grouped[cat].length})</span>
            </div>

            <div className="space-y-2">
              {grouped[cat].map((doc) => (
                <div key={doc.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm">{doc.title}</h3>
                      {doc.version && (
                        <span className="badge-gray text-xs">{doc.version}</span>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{doc.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatBytes(doc.file_size)}
                      {doc.file_size ? ' · ' : ''}
                      {new Date(doc.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 text-slate-500 hover:bg-gray-200 transition-colors"
                      title="View"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={doc.file_url}
                      download={doc.file_name ?? doc.title}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      <div className="card p-5 bg-primary-50 border border-primary-100">
        <p className="text-sm text-primary-800 font-medium">Need a specific document?</p>
        <p className="text-sm text-primary-700 mt-1">
          Contact the foundation for any documents not listed here.{' '}
          <Link href="/contact" className="underline font-semibold hover:text-primary-900">
            Get in touch →
          </Link>
        </p>
      </div>
    </div>
  )
}
