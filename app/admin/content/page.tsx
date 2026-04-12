import { createClient } from '@/lib/supabase/server'
import AdminContentClient from '@/components/admin/AdminContentClient'
import { deleteBlogPost, togglePostStatus, saveProgram, deleteProgram, toggleProgramStatus } from '@/app/actions/admin'

export const metadata = { title: 'Content Management — Admin' }

export default async function AdminContentPage() {
  const supabase = await createClient()

  const [postsResult, programsResult] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, category, status, views, read_time, published_at, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('programs')
      .select('id, slug, title, description, beneficiaries, is_active, created_at')
      .order('created_at', { ascending: false }),
  ])

  const posts    = postsResult.data ?? []
  const programs = programsResult.data ?? []

  return (
    <AdminContentClient
      posts={posts as any[]}
      programs={programs as any[]}
      deleteBlogPost={deleteBlogPost}
      togglePostStatus={togglePostStatus}
      saveProgram={saveProgram}
      deleteProgram={deleteProgram}
      toggleProgramStatus={toggleProgramStatus}
    />
  )
}

