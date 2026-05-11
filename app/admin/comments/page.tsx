import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import CommentsClient from '@/components/admin/CommentsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Blog Comments | Admin' }

export default async function AdminCommentsPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('blog_comments')
    .select(`
      id, post_id, author_name, body, is_approved, parent_id, created_at,
      blog_posts ( title, slug )
    `)
    .order('created_at', { ascending: false })

  const comments = (raw ?? []).map((c) => ({
    ...c,
    blog_posts: Array.isArray(c.blog_posts) ? (c.blog_posts[0] ?? null) : c.blog_posts,
  }))

  return <CommentsClient comments={comments} />
}
