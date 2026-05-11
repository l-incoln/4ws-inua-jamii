import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentsManager from '@/components/admin/DocumentsManager'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Documents Management' }

export default async function AdminDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, description, file_url, file_name, file_size, category, version, is_public, created_at')
    .order('created_at', { ascending: false })

  return <DocumentsManager documents={documents ?? []} />
}
