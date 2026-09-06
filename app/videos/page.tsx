import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import PageBackLink from '@/components/layout/PageBackLink'
import { createPublicClient } from '@/lib/supabase/public-client'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Video } from 'lucide-react'
import LazyVideoCard from '@/components/videos/LazyVideoCard'
import { getYouTubeEmbed, getYouTubeThumb } from '@/lib/video-utils'

export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Videos',
    description: "Watch videos of 4W'S Inua Jamii Foundation's community impact, events, and outreach activities across Kenya.",
    path: '/videos',
  })
}

export default async function VideosPage() {
  const supabase = createPublicClient()

  const { data: videos } = await supabase
    .from('gallery_items')
    .select('id, title, description, image_url, video_url, category, event_name, created_at')
    .not('video_url', 'is', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              <Video className="w-3 h-3 inline mr-1" /> Videos
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Stories in <span className="text-sky-400">Motion</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              Watch our community impact, events, and outreach activities come to life.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PageBackLink href="/" label="Back to Home" className="mb-6" />
            {(!videos || videos.length === 0) ? (
              <div className="text-center py-20">
                <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-700">No videos yet</h2>
                <p className="text-slate-400 mt-2">Check back soon for videos of our work in the community.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((v) => {
                  const embedUrl = v.video_url ? getYouTubeEmbed(v.video_url) : null
                  const thumb = v.image_url || (v.video_url ? getYouTubeThumb(v.video_url) : null)
                  return (
                    <LazyVideoCard
                      key={v.id}
                      title={v.title}
                      description={v.description}
                      eventName={v.event_name}
                      embedUrl={embedUrl}
                      posterUrl={thumb}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
