import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BlogGrid from '@/components/blog/BlogGrid'
import { BookOpen } from 'lucide-react'
import { createPublicClient } from '@/lib/supabase/public-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog & Stories',
  description: "Impact stories, updates, and insights from 4W'S Inua Jamii Foundation.",
}

export default async function BlogPage() {
  const supabase = createPublicClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, image_url, read_time, published_at, created_at, profiles!author_id(full_name, avatar_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  const allPosts = (posts ?? []).map((p) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles,
  }))

  // Unique categories from posts
  const categories = Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean))) as string[]

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              Blog &amp; Stories
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Stories of <span className="text-sky-400">Impact</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              Real stories from the communities we serve, program updates, and insights on community development.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {allPosts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-700">No posts yet</h2>
                <p className="text-slate-400 mt-2">Check back soon for stories and updates.</p>
              </div>
            ) : (
              <BlogGrid posts={allPosts} categories={categories} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

