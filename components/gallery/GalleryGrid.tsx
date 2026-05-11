'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Calendar, Tag, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type GalleryItem = {
  id: string
  title: string
  description: string | null
  image_url: string
  category: string | null
  event_name: string | null
  taken_at: string | null
}

interface Props {
  items: GalleryItem[]
  categories: string[]
}

export default function GalleryGrid({ items, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = activeCategory === 'All'
    ? items
    : items.filter((i) => i.category === activeCategory)

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filtered.length) % filtered.length : null))
  }, [filtered.length])

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filtered.length : null))
  }, [filtered.length])

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-lg font-medium">No photos yet</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon for event highlights.</p>
        </div>
      ) : (
        <motion.div
          layout
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
        >
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-shadow"
                onClick={() => openLightbox(idx)}
              >
                <div className="relative w-full">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-white font-semibold text-sm leading-tight">{item.title}</p>
                    {item.event_name && (
                      <p className="text-white/80 text-xs mt-0.5">{item.event_name}</p>
                    )}
                  </div>
                  {/* Category badge */}
                  {item.category && (
                    <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {item.category}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {current && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Prev */}
            {filtered.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                aria-label="Previous"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}

            {/* Image + info */}
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex-1 min-h-0">
                <Image
                  src={current.image_url}
                  alt={current.title}
                  width={1200}
                  height={800}
                  className="w-full max-h-[75vh] object-contain rounded-lg"
                  unoptimized
                />
              </div>
              <div className="mt-3 px-1">
                <h3 className="text-white font-bold text-lg">{current.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {current.event_name && (
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> {current.event_name}
                    </span>
                  )}
                  {current.taken_at && (
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(current.taken_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {current.category && (
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> {current.category}
                    </span>
                  )}
                </div>
                {current.description && (
                  <p className="text-white/60 text-sm mt-1">{current.description}</p>
                )}
              </div>
            </motion.div>

            {/* Next */}
            {filtered.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                aria-label="Next"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}

            {/* Counter */}
            {filtered.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/40 px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {filtered.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
