import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MediaManager from '@/components/admin/MediaManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Media Library — Admin' }

const PER_PAGE = 20

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: { folder?: string; type?: string; page?: string; q?: string; tag?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const folder   = searchParams.folder || 'all'
  const fileType = searchParams.type   || 'all'
  const page     = Math.max(1, Number(searchParams.page) || 1)
  const q        = searchParams.q   || ''
  const tag      = searchParams.tag || ''

  const from = (page - 1) * PER_PAGE
  const to   = from + PER_PAGE - 1

  let query = supabase
    .from('media_assets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (folder   && folder   !== 'all') query = query.eq('folder',    folder)
  if (fileType && fileType !== 'all') query = query.eq('file_type', fileType)
  if (q)   query = query.or(`file_name.ilike.%${q}%,title.ilike.%${q}%`)
  if (tag) query = query.contains('tags', [tag])

  const { data, count, error } = await query

  if (error) {
    return (
      <div className="p-8 card text-center space-y-4">
        <p className="text-slate-600 font-semibold">Media Library not yet initialised</p>
        <p className="text-slate-400 text-sm">
          Run the SQL in <code className="bg-gray-100 px-1 rounded">supabase/schema.sql</code> to create the{' '}
          <code className="bg-gray-100 px-1 rounded">media_assets</code> table, then refresh.
        </p>
      </div>
    )
  }

  return (
    <MediaManager
      initialItems={data ?? []}
      initialTotal={count ?? 0}
      folder={folder}
      fileType={fileType}
      page={page}
      q={q}
      tag={tag}
      perPage={PER_PAGE}
    />
  )
}
