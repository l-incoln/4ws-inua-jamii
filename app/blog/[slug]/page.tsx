import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

type Props = { params: { slug: string } }

async function getPost(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, body, category, tags, image_url, published_at, read_time, profiles!author_id(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post Not Found' }
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug)
  if (!post) notFound()

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
        <div className="prose prose-lg max-w-none text-slate-700">
          {(post.body ?? '').split('\n\n').map((para: string, i: number) => {
            if (para.startsWith('## ')) {
              return <h2 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-3">{para.slice(3)}</h2>
            }
            if (para.startsWith('- ')) {
              const items = para.split('\n').filter((line) => line.startsWith('- '))
              return (
                <ul key={i} className="list-disc list-inside space-y-1.5 my-4 text-slate-600">
                  {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
                </ul>
              )
            }
            return <p key={i} className="mb-4 leading-relaxed">{para}</p>
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
      </div>
    </div>
    <Footer />
    </>
  )
}
