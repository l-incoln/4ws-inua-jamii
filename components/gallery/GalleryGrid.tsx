'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Calendar, Tag, Camera, GripVertical, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type GalleryItem = {
  id: string
  title: string
  description: string | null
  image_url: string
  category: string | null
  event_name: string | null
  taken_at: string | null
  sort_order?: number
  focal_x?: number | null
  focal_y?: number | null
}

interface Props {
  items: GalleryItem[]
  categories: string[]
  /** When true, drag-and-drop reordering is enabled */
  adminMode?: boolean
  onReorder?: (orderedIds: string[]) => Promise<void>
}

export default function GalleryGrid({ items, categories, adminMode, onReorder }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [orderedItems, setOrderedItems] = useState<GalleryItem[]>(items)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const dragOverId = useRef<string | null>(null)

  const filtered = activeCategory === 'All'
    ? orderedItems
    : orderedItems.filter((i) => i.category === activeCategory)

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filtered.length) % filtered.length : null))
  }, [filtered.length])

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filtered.length : null))
  }, [filtered.length])

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null

  // Drag-and-drop reorder (admin only)
  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    dragOverId.current = id
  }
  const handleDrop = async () => {
    if (!draggingId || !dragOverId.current || draggingId === dragOverId.current) {
      setDraggingId(null)
      return
    }
    const newOrder = [...orderedItems]
    const fromIdx = newOrder.findIndex((i) => i.id === draggingId)
    const toIdx   = newOrder.findIndex((i) => i.id === dragOverId.current)
    const [moved] = newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, moved)
    setOrderedItems(newOrder)
    setDraggingId(null)
    dragOverId.current = null
    if (onReorder) {
      setSavingOrder(true)
      await onReorder(newOrder.map((i) => i.id))
      setSavingOrder(false)
    }
  }

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

      {adminMode && savingOrder && (
        <div className="flex items-center gap-2 mb-4 text-sm text-primary-700 bg-primary-50 px-4 py-2 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" /> Saving new order…
        </div>
      )}
      {adminMode && !savingOrder && orderedItems.length > 0 && (
        <p className="text-xs text-slate-400 mb-4 text-center">
          Drag photos to reorder them
        </p>
      )}

      {/* Masonry Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-lg font-medium">No photos yet</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon for event highlights.</p>
        </div>
      ) : (
        <motion.div
          layout
          className="columns-1 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4"
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
                draggable={adminMode}
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={handleDrop}
                onDragEnd={() => setDraggingId(null)}
                className={`break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl shadow-sm hover:shadow-xl hover:shadow-primary-900/20 transition-all duration-300 ${
                  draggingId === item.id ? 'opacity-40 scale-95' : ''
                }`}
                onClick={() => !adminMode && openLightbox(idx)}
              >
                {adminMode && (
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white rounded p-1 cursor-grab" title="Drag to reorder">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
                <div className="relative w-full">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    width={600}
                    height={400}
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ objectPosition: `${item.focal_x ?? 50}% ${item.focal_y ?? 50}%` }}
                    unoptimized
                  />
                  {/* Brand-tinted gradient overlay — deep navy fading up */}
                  <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-primary-900/95 via-primary-800/40 to-transparent pointer-events-none rounded-b-xl transition-all duration-300 group-hover:from-primary-900/[0.98] group-hover:via-primary-800/50" />
                  {/* Caption */}
                  <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-6 pointer-events-none">
                    <p className="text-white font-semibold text-sm leading-snug drop-shadow-md line-clamp-2 tracking-wide">{item.title}</p>
                    {item.event_name && (
                      <p className="text-sky-300 text-xs mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="w-1 h-1 rounded-full bg-sky-400 shrink-0 inline-block" />
                        {item.event_name}
                      </p>
                    )}
                  </div>
                  {item.category && (
                    <span className="absolute top-2 right-2 bg-primary-900/70 text-sky-200 text-xs px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10 font-medium tracking-wide">
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
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2 bg-white/10 rounded-full backdrop-blur-sm"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {filtered.length > 1 && (
              <button
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                aria-label="Previous"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}

            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl w-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current.image_url}
                alt={current.title}
                width={1200}
                height={800}
                priority
                className="w-full max-h-[72vh] object-contain rounded-lg"
                unoptimized
              />
              <div className="mt-3 px-1">
                <h3 className="text-white font-bold text-base sm:text-lg">{current.title}</h3>
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

            {filtered.length > 1 && (
              <button
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                aria-label="Next"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}

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
