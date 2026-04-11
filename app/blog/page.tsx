import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog & Stories',
  description: "Impact stories, updates, and insights from 4W'S Inua Jamii Foundation.",
}

const categoryColors: Record<string, string> = {
  Impact:        'badge-green',
  Stories:       'badge-sky',
  Announcements: 'bg-sky-100 text-sky-800 badge',
  Updates:       'badge-gray',
  Health:        'badge-green',
  Education:     'badge-sky',
  Environment:   'badge-green',
  Empowerment:   'badge-sky',
  Community:     'badge-gray',
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80'
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80'

export default async function BlogPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, image_url, read_time, published_at, created_at, author_id, profiles!author_id(full_name, avatar_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const allPosts = (posts ?? []) as any[]
  const featured = allPosts[0] ?? null
  const rest     = allPosts.slice(1)

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
              <>
                {/* Featured post */}
                {featured && (
                  <div className="mb-14">
                    <Link href={`/blog/${featured.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-0 card overflow-hidden rounded-3xl">
                      <div className="relative h-64 lg:h-full min-h-[300px]">
                        <Image
                          src={featured.image_url || PLACEHOLDER_IMG}
                          alt={featured.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent lg:block hidden" />
                      </div>
                      <div className="p-8 md:p-10 flex flex-col justify-center">
                        <span className={`${categoryColors[featured.category] ?? 'badge-gray'} mb-3 self-start`}>
                          ⭐ Featured · {featured.category ?? 'General'}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                          {featured.title}
                        </h2>
                        {featured.excerpt && (
                          <p className="mt-3 text-slate-500 leading-relaxed">{featured.excerpt}</p>
                        )}
                        <div className="mt-6 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Image
                              src={(featured.profiles as any)?.avatar_url || PLACEHOLDER_AVATAR}
                              alt={(featured.profiles as any)?.full_name ?? 'Author'}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {(featured.profiles as any)?.full_name ?? 'Team'}
                            </span>
                          </div>
                          <span className="text-slate-300">·</span>
                          <span className="text-sm text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(featured.published_at ?? featured.created_at).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                          Read Story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Post grid */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((post: any) => (
                      <article key={post.slug} className="card group">
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={post.image_url || PLACEHOLDER_IMG}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3">
                            <span className={categoryColors[post.category] || 'badge-gray'}>
                              {post.category ?? 'General'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                          )}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Image
                                src={(post.profiles as any)?.avatar_url || PLACEHOLDER_AVATAR}
                                alt={(post.profiles as any)?.full_name ?? 'Author'}
                                width={24}
                                height={24}
                                className="rounded-full object-cover"
                              />
                              <span className="text-xs text-slate-500">
                                {(post.profiles as any)?.full_name ?? 'Team'}
                              </span>
                            </div>
                            {post.read_time && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" /> {post.read_time}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:gap-2 transition-all"
                          >
                            Read More <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

