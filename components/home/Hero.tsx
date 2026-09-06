'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Users, Globe, Heart, TrendingUp, Award, Calendar, MapPin } from 'lucide-react'

type HeroSettings = {
  hero_title?:      string
  hero_subtitle?:   string
  hero_cta_label?:  string
  hero_cta_url?:    string
  hero_badge_text?: string
  hero_image_url?:  string
}

export type HeroStat = {
  value: string
  label: string
  icon: 'users' | 'globe' | 'heart' | 'trending' | 'award'
}

export type HeroEventSlide = {
  id: string
  title: string
  image_url: string
  event_date: string
  location?: string | null
}

type Slide = {
  image: string
  event?: HeroEventSlide
}

const iconMap = { users: Users, globe: Globe, heart: Heart, trending: TrendingUp, award: Award }

const SLIDESHOW_INTERVAL = 5000 // ms between slides
const FADE_DURATION = 1.2 // seconds for crossfade

export default function Hero({
  settings = {},
  stats = [],
  images = [],
  eventSlides = [],
}: {
  settings?: HeroSettings
  stats?: HeroStat[]
  images?: string[]
  eventSlides?: HeroEventSlide[]
}) {
  const badgeText  = settings.hero_badge_text || 'Transforming Communities Across Kenya'
  const heroTitle  = settings.hero_title || ''
  const subtitle   = settings.hero_subtitle  || '4W\u2019S Inua Jamii Foundation unites passionate individuals to uplift communities through health, education, economic empowerment, and environmental stewardship.'
  const ctaLabel   = settings.hero_cta_label || 'Join the Movement'
  const ctaUrl     = settings.hero_cta_url   || '/auth/signup'
  const singleImage = settings.hero_image_url || ''

  // Build the slideshow list: event slides + uploaded hero images,
  // then fall back to the single hero_image_url, then empty (gradient-only).
  const slides: Slide[] = useMemo(() => {
    const eventImgs: Slide[] = eventSlides
      .filter((e) => e.image_url)
      .map((e) => ({ image: e.image_url, event: e }))
    const heroImgs: Slide[] = images.map((url) => ({ image: url }))
    const combined = [...eventImgs, ...heroImgs]
    if (combined.length > 0) return combined
    if (singleImage) return [{ image: singleImage }]
    return []
  }, [images, singleImage, eventSlides])

  const [currentSlide, setCurrentSlide] = useState(0)
  const slidesLength = slides.length

  useEffect(() => {
    if (slidesLength <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesLength)
    }, SLIDESHOW_INTERVAL)
    return () => clearInterval(interval)
  }, [slidesLength])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay">
      {/* Deep layered background */}
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* Slideshow background images with smooth crossfade + Ken Burns zoom */}
      {slides.length > 0 && (
        <div className="absolute inset-0">
          {slides.map((slide, i) => {
            const isActive = i === currentSlide
            return (
              <motion.div
                key={slide.image + '-' + i}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              >
                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  initial={{ scale: 1 }}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: (SLIDESHOW_INTERVAL + 1200) / 1000, ease: 'easeOut' }}
                >
                  <Image
                    src={slide.image}
                    alt={slide.event?.title || 'Hero background'}
                    fill
                    className="object-cover object-[center_25%]"
                    priority={i === 0}
                    unoptimized
                  />
                </motion.div>
              </motion.div>
            )
          })}
          {/* Dark overlay to keep text readable over photos */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/70" />
        </div>
      )}

      {/* Event slide info card — shows when the current slide is an event */}
      {slides[currentSlide]?.event && (
        <motion.div
          key={slides[currentSlide]!.event!.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-32 left-4 sm:left-8 lg:left-12 z-20 max-w-sm"
        >
          <Link
            href={`/events/${slides[currentSlide]!.event!.id}`}
            className="block glass border border-white/20 rounded-2xl p-4 sm:p-5 hover:bg-white/15 transition-colors group"
          >
            <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-widest mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Event
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-sky-200 transition-colors">
              {slides[currentSlide]!.event!.title}
            </h3>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <Calendar className="w-3 h-3" />
                {new Date(slides[currentSlide]!.event!.event_date).toLocaleDateString('en-KE', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}
              </div>
              {slides[currentSlide]!.event!.location && (
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{slides[currentSlide]!.event!.location}</span>
                </div>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-300 group-hover:gap-2 transition-all">
              View Event <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Slideshow indicators with progress bar */}
      {slides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="group relative h-2 rounded-full overflow-hidden bg-white/20"
              style={{ width: i === currentSlide ? '40px' : '12px', transition: 'width 400ms ease' }}
              aria-label={`Slide ${i + 1}`}
            >
              {i === currentSlide && (
                <div
                  key={currentSlide}
                  className="absolute inset-0 bg-white rounded-full origin-left"
                  style={{
                    transformOrigin: 'left center',
                    animation: `hero-progress ${SLIDESHOW_INTERVAL}ms linear forwards`,
                  }}
                />
              )}
            </button>
          ))}
          {/* Slide counter */}
          <span className="ml-2 text-xs text-white/70 font-medium tabular-nums">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      )}

      {/* Static glow orbs — CSS-only, no JS animation (perf) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* orbs hidden on mobile for performance */}
        <div className="hidden sm:block absolute inset-0">
          {/* Single centre glow — static, no infinite animation */}
          <div
            className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
            style={{ background: 'radial-gradient(circle, #2D5CC8 0%, transparent 70%)' }}
          />
          {/* Single bottom-left accent — static */}
          <div
            className="absolute bottom-0 -left-20 w-[350px] h-[350px] rounded-full blur-[80px] opacity-10"
            style={{ background: 'radial-gradient(circle, #6DBE45 0%, transparent 70%)' }}
          />
        </div>

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Diagonal light streak */}
        <div
          className="absolute top-0 left-1/4 w-px h-full opacity-[0.08]"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,1) 50%, transparent 100%)', transform: 'rotate(18deg) scaleY(2)', transformOrigin: 'top' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 glass border border-white/20 rounded-full px-5 py-2.5 text-sm text-white/90 mb-9"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
            </span>
            {badgeText}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight"
          >
            {heroTitle ? (
              heroTitle
            ) : (
              <>
                Building{' '}
                <span className="relative inline-block">
                  <span className="text-gradient-sky bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">
                    Stronger
                  </span>
                  <motion.span
                    className="absolute -bottom-1.5 left-0 right-0 h-[3px] rounded-full"
                    style={{ background: 'linear-gradient(90deg, #38BDF8, #7DD3FC)' }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 0.9 }}
                  />
                </span>
                <br />
                Communities Together
              </>
            )}
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 sm:mt-7 text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={ctaUrl} className="btn-gold text-base px-8 py-4 w-full sm:w-auto">
              {ctaLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 text-white/90 hover:text-white transition-colors text-sm font-semibold group w-full sm:w-auto justify-center"
            >
              <div className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all duration-200 group-hover:scale-110">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              Watch Our Story
            </Link>
          </motion.div>

          {/* Floating stat cards — live from impact_metrics */}
          {stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10 sm:mt-14 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto"
            >
              {stats.slice(0, 3).map(({ value, label, icon }, i) => {
                const Icon = iconMap[icon] || Users
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                    className="glass border border-white/10 rounded-2xl px-2 sm:px-4 py-4 sm:py-5 text-center group hover:bg-white/15 transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-none">{value}</div>
                    <div className="text-[10px] sm:text-[11px] text-primary-200 mt-1.5 uppercase tracking-widest leading-tight">{label}</div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
      >
        <span className="text-[11px] uppercase tracking-widest">Scroll to explore</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </section>
  )
}

