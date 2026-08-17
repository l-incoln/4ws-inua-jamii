import { createClient } from '@/lib/supabase/server'
import BlogEditor from '@/components/admin/BlogEditor'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Edit Blog Post — Admin' }

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, body, category, tags, image_url, status, read_time')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div className="space-y-0">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Content
      </Link>
      <BlogEditor post={post as any} />
    </div>
  )
}
