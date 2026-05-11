import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public-client'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BlogComments from '@/components/blog/BlogComments'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, body, category, tags, image_url, published_at, read_time, views, profiles!author_id(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post Not Found' }
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const supabase = await createClient()

  // Increment view count (best-effort, non-blocking)
  supabase.from('blog_posts').update({ views: (post.views ?? 0) + 1 }).eq('id', post.id).then(() => {})

  // Fetch approved comments
  const { data: comments } = await supabase
    .from('blog_comments')
    .select('id, author_name, body, created_at, parent_id')
    .eq('post_id', post.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: true })

  // Check if user is logged in and get their name
  const { data: { user } } = await supabase.auth.getUser()
  let userName: string | undefined
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    userName = profile?.full_name ?? user.email ?? undefined
  }

  const authorArr = post.profiles as unknown as { full_name: string; avatar_url: string | null }[] | null
  const author = Array.isArray(authorArr) ? (authorArr[0] ?? null) : null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-80 sm:h-96 lg:h-[28rem]">
        {post.image_url ? (
          <Image src={post.image_url} alt={post.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-primary-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <span className="badge-green mb-3">{post.category}</span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Article */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-gray-100">
          {author && (
            <div className="flex items-center gap-2">
              {author.avatar_url ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image src={author.avatar_url} alt={author.full_name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                  {author.full_name.charAt(0)}
                </div>
              )}
              <div className="font-semibold text-slate-700">{author.full_name}</div>
            </div>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {post.read_time && (
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.read_time} min read</span>
          )}
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">{post.excerpt}</p>
        )}

        {/* Body */}
        <div className="article-body mt-2">
          {(post.body ?? '').split('\n\n').map((para: string, i: number) => {
            const trimmed = para.trim()
            if (!trimmed) return null
            if (trimmed.startsWith('### ')) {
              return <h3 key={i}>{trimmed.slice(4)}</h3>
            }
            if (trimmed.startsWith('## ')) {
              return <h2 key={i}>{trimmed.slice(3)}</h2>
            }
            if (trimmed.startsWith('# ')) {
              return <h1 key={i}>{trimmed.slice(2)}</h1>
            }
            if (trimmed.startsWith('> ')) {
              return <blockquote key={i}>{trimmed.slice(2)}</blockquote>
            }
            if (trimmed.startsWith('---')) {
              return <hr key={i} />
            }
            if (trimmed.split('\n').every((l) => l.startsWith('- '))) {
              return (
                <ul key={i}>
                  {trimmed.split('\n').filter((l) => l.startsWith('- ')).map((item, j) => (
                    <li key={j}>{item.slice(2)}</li>
                  ))}
                </ul>
              )
            }
            if (trimmed.split('\n').every((l, idx) => l.match(new RegExp(`^${idx + 1}\\. `)))) {
              return (
                <ol key={i}>
                  {trimmed.split('\n').map((item, j) => (
                    <li key={j}>{item.replace(/^\d+\.\s/, '')}</li>
                  ))}
                </ol>
              )
            }
            return <p key={i}>{trimmed}</p>
          })}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-gray-100">
            <Tag className="w-4 h-4 text-slate-400" />
            {(post.tags as string[]).map((tag) => (
              <span key={tag} className="badge-gray">{tag}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 p-6 bg-primary-50 rounded-2xl border border-primary-100">
          <h3 className="font-bold text-primary-800 mb-2">Support our work</h3>
          <p className="text-sm text-primary-700 mb-4">Stories like these are made possible by our donors and volunteers. Your support means more lives changed.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/donate" className="btn-primary text-sm">Donate Now</Link>
            <Link href="/auth/signup" className="btn-secondary text-sm">Join as Member</Link>
          </div>
        </div>

        {/* Comments */}
        <BlogComments
          postId={post.id}
          comments={comments ?? []}
          isLoggedIn={!!user}
          userName={userName}
        />
      </div>
    </div>
    <Footer />
    </>
  )
}
