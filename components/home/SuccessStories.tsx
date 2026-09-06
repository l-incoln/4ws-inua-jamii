import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Quote } from 'lucide-react'

type Story = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  image_url: string | null
  category: string | null
  published_at: string | null
  read_time: string | null
}

export default function SuccessStories({ stories = [] }: { stories?: Story[] }) {
  if (stories.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="badge-gold text-xs uppercase tracking-widest mb-3 inline-block">
              Impact Stories
            </span>
            <h2 className="section-title">Real Change, Real People</h2>
            <p className="section-subtitle max-w-xl mt-2">
              The lives transformed and communities uplifted through your support.
            </p>
          </div>
          <Link href="/stories" className="btn-secondary shrink-0">
            All Stories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured story + grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured (first story, spans 2 cols) */}
          {stories[0] && (
            <Link
              href={`/blog/${stories[0].slug}`}
              className="lg:col-span-2 group relative rounded-3xl overflow-hidden min-h-[340px] block"
            >
              {stories[0].image_url ? (
                <Image
                  src={stories[0].image_url}
                  alt={stories[0].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-4 h-4 text-amber-400" />
                  <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                    {stories[0].category || 'Featured Story'}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-amber-100 transition-colors leading-tight">
                  {stories[0].title}
                </h3>
                {stories[0].excerpt && (
                  <p className="text-sm text-white/70 mt-2 line-clamp-2 max-w-xl">
                    {stories[0].excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-4 text-amber-400 text-sm font-semibold">
                  Read Story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* Secondary stories (stacked) */}
          <div className="space-y-4">
            {stories.slice(1, 3).map((story) => (
              <Link
                key={story.id}
                href={`/blog/${story.slug}`}
                className="group flex gap-4 bg-slate-50 rounded-2xl p-4 hover:bg-slate-100 transition-colors"
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                  {story.image_url ? (
                    <Image
                      src={story.image_url}
                      alt={story.title}
                      fill
                      sizes="96px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-primary-600 font-semibold">
                    {story.category || 'Story'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition-colors line-clamp-2 mt-1">
                    {story.title}
                  </h4>
                  {story.excerpt && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{story.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
