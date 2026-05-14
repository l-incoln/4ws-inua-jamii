import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { createPublicClient } from '@/lib/supabase/public-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Gallery',
  description: "Photos from 4W'S Inua Jamii Foundation events and community activities.",
}

export default async function GalleryPage() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('gallery_items')
    .select('id, title, description, image_url, category, event_name, taken_at, focal_x, focal_y')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const items = (data ?? []).filter((i) => !!i.image_url)
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[]

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              Gallery
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Moments of <span className="text-sky-400">Impact</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              A visual journey through our events, programmes, and community activities.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-gray-50 min-h-[60vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <GalleryGrid items={items} categories={categories} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
