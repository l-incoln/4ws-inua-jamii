import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Camera } from 'lucide-react'

type GalleryItem = {
  id: string
  title: string
  image_url: string
  category: string | null
  event_name: string | null
}

export default function GalleryPreview({ items = [] }: { items?: GalleryItem[] }) {
  if (items.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
              Gallery
            </span>
            <h2 className="section-title">Our Work in Pictures</h2>
            <p className="section-subtitle max-w-xl mt-2">
              Moments from the field — every photo tells a story of impact.
            </p>
          </div>
          <Link href="/gallery" className="btn-secondary shrink-0">
            Full Gallery
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {items.slice(0, 8).map((item, i) => (
            <Link
              key={item.id}
              href="/gallery"
              className={`group relative overflow-hidden rounded-2xl bg-gray-200 ${
                i === 0 ? 'col-span-2 row-span-2 min-h-[280px] md:min-h-[340px]' : 'min-h-[140px] md:min-h-[165px]'
              }`}
            >
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                sizes={i === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-xs font-semibold line-clamp-1">{item.title}</p>
                {item.event_name && (
                  <p className="text-white/60 text-[10px] mt-0.5">{item.event_name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile see more */}
        <div className="mt-6 text-center md:hidden">
          <Link href="/gallery" className="btn-secondary text-sm inline-flex">
            <Camera className="w-4 h-4" /> View Full Gallery
          </Link>
        </div>
      </div>
    </section>
  )
}
