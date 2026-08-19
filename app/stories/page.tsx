import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import BlogGrid from '@/components/blog/BlogGrid'
import { createPublicClient } from '@/lib/supabase/public-client'
import type { Metadata } from 'next'
import { Heart, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Success & Impact Stories | 4W\'S Inua Jamii Foundation',
  description: 'Real stories of lives transformed through our programs — success stories and impact stories from the communities we serve.',
}

const STORY_CATEGORIES = ['Stories', 'Impact', 'Success Story']

export default async function StoriesPage() {
  const supabase = createPublicClient()

  // Fetch published posts in story-related categories
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, image_url, read_time, published_at, created_at, profiles!author_id(full_name, avatar_url)')
    .eq('status', 'published')
    .in('category', STORY_CATEGORIES)
    .order('published_at', { ascending: false })
    .limit(30)

  const allPosts = (posts ?? []).map((p) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles,
  }))

  const categories = Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean))) as string[]

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              <Heart className="w-3 h-3 inline mr-1" /> Stories
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Stories of <span className="text-sky-400">Hope</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              Real stories of lives transformed through our programs. Every story represents a person, a family, a community changed.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {allPosts.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-700">No stories yet</h2>
                <p className="text-slate-400 mt-2">Check back soon for inspiring stories from our community.</p>
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
