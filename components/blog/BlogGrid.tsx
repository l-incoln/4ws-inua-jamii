'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'

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

const PLACEHOLDER_IMG    = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80'
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80'

interface Post {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  category?: string | null
  image_url?: string | null
  read_time?: string | null
  published_at?: string | null
  created_at: string
  profiles?: { full_name?: string; avatar_url?: string | null } | null
}

interface Props {
  posts: Post[]
  categories: string[]
}

export default function BlogGrid({ posts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter((p) => p.category === activeCategory)

  const featured = filtered[0] ?? null
  const rest     = filtered.slice(1)

  return (
    <>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeCategory === cat
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">No posts in this category yet.</p>
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
                  <span className={`${categoryColors[featured.category ?? ''] ?? 'badge-gray'} mb-3 self-start`}>
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
                        src={featured.profiles?.avatar_url || PLACEHOLDER_AVATAR}
                        alt={featured.profiles?.full_name ?? 'Author'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-slate-700">{featured.profiles?.full_name ?? 'Author'}</span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(featured.published_at ?? featured.created_at).toLocaleDateString('en-KE', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    {featured.read_time && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> {featured.read_time} min read
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-6 flex items-center gap-1 text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Read Story <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card overflow-hidden group">
                  <div className="relative h-48">
                    <Image
                      src={post.image_url || PLACEHOLDER_IMG}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-5">
                    <span className={`${categoryColors[post.category ?? ''] ?? 'badge-gray'} mb-3 inline-block`}>
                      {post.category ?? 'General'}
                    </span>
                    <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at ?? post.created_at).toLocaleDateString('en-KE', {
                          month: 'short', day: 'numeric',
                        })}
                      </span>
                      {post.read_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.read_time} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
