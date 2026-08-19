import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import PageBackLink from '@/components/layout/PageBackLink'
import { createPublicClient } from '@/lib/supabase/public-client'
import type { Metadata } from 'next'
import { Video, Play } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Videos | 4W\'S Inua Jamii Foundation',
  description: 'Watch videos of our community impact, events, and outreach activities.',
}

function getYouTubeEmbed(url: string): string | null {
  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  // Already an embed URL
  if (url.includes('/embed/')) return url
  return null
}

export default async function VideosPage() {
  const supabase = createPublicClient()

  const { data: videos } = await supabase
    .from('gallery_items')
    .select('id, title, description, image_url, video_url, category, event_name, created_at')
    .not('video_url', 'is', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

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
                  return (
                    <div key={v.id} className="card overflow-hidden p-0">
                      {embedUrl ? (
                        <div className="aspect-video bg-black">
                          <iframe
                            src={embedUrl}
                            title={v.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                          <img src={v.image_url} alt={v.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          <Play className="w-12 h-12 text-white relative z-10" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 text-sm">{v.title}</h3>
                        {v.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.description}</p>}
                        {v.event_name && <p className="text-xs text-slate-400 mt-2">{v.event_name}</p>}
                      </div>
                    </div>
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
