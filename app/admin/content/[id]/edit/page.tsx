import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BlogEditor from '@/components/admin/BlogEditor'

export const metadata = { title: 'Edit Post — Admin' }

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, body, category, tags, image_url, status, read_time')
    .eq('id', params.id)
    .single()

  if (error || !post) return notFound()

  return (
    <div className="space-y-0">
      <BlogEditor post={post as any} />
    </div>
  )
}
