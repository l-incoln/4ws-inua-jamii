import BlogEditor from '@/components/admin/BlogEditor'

export const metadata = { title: 'New Blog Post — Admin' }

export default function NewBlogPostPage() {
  return (
    <div className="space-y-0">
      <BlogEditor />
    </div>
  )
}
