'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface Props {
  title: string
  description?: string | null
  eventName?: string | null
  embedUrl: string | null
  posterUrl: string | null
}

export default function LazyVideoCard({ title, description, eventName, embedUrl, posterUrl }: Props) {
  const [activated, setActivated] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Only load the poster image when the card is near the viewport.
  useEffect(() => {
    if (!ref.current || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inView])

  return (
    <div ref={ref} className="card overflow-hidden p-0">
      <div className="aspect-video bg-black relative">
        {activated && embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : embedUrl ? (
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="absolute inset-0 w-full h-full cursor-pointer group"
            aria-label={`Play video: ${title}`}
          >
            {posterUrl && inView ? (
              <Image
                src={posterUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <div className="absolute inset-0 bg-slate-900" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 flex items-center justify-center shadow-lg transition-all">
                <Play className="w-6 h-6 text-primary-700 fill-current ml-0.5" />
              </span>
            </div>
          </button>
        ) : (
          <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
            {posterUrl && inView ? (
              <Image
                src={posterUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover opacity-60"
              />
            ) : null}
            <Play className="w-12 h-12 text-white relative z-10" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>}
        {eventName && <p className="text-xs text-slate-400 mt-2">{eventName}</p>}
      </div>
    </div>
  )
}
