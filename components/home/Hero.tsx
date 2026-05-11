'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Users, Globe, Heart } from 'lucide-react'

type HeroSettings = {
  hero_title?:      string
  hero_subtitle?:   string
  hero_cta_label?:  string
  hero_cta_url?:    string
  hero_badge_text?: string
  hero_image_url?:  string
}

const stats = [
  { value: '5,000+', label: 'Beneficiaries', icon: Users },
  { value: '12',     label: 'Active Programs', icon: Globe },
  { value: '350+',   label: 'Volunteers', icon: Heart },
]

export default function Hero({ settings = {} }: { settings?: HeroSettings }) {
  const badgeText  = settings.hero_badge_text || 'Transforming Communities Across Kenya'
  const heroTitle  = settings.hero_title || ''
  const subtitle   = settings.hero_subtitle  || '4W\u2019S Inua Jamii Foundation unites passionate individuals to uplift communities through health, education, economic empowerment, and environmental stewardship.'
  const ctaLabel   = settings.hero_cta_label || 'Join the Movement'
  const ctaUrl     = settings.hero_cta_url   || '/auth/signup'
  const imageUrl   = settings.hero_image_url || ''
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden noise-overlay">
      {/* Deep layered background */}
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* Optional hero background image */}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt="Hero background"
          fill
          className="object-cover opacity-20"
          priority
          unoptimized
        />
      )}

      {/* Animated glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large centre glow */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, #2D5CC8 0%, transparent 70%)' }}
        />
        {/* Sky-blue top-right orb */}
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.10, 0.18, 0.10] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, #4FA3D1 0%, transparent 70%)' }}
        />
        {/* Green bottom-left orb */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.14, 0.06] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, #6DBE45 0%, transparent 70%)' }}
        />

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
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight"
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
            className="mt-7 text-lg md:text-xl text-primary-100/90 max-w-2xl mx-auto leading-relaxed"
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

          {/* Floating stat cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-14 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                className="glass border border-white/10 rounded-2xl px-4 py-5 text-center group hover:bg-white/15 transition-colors duration-200"
              >
                <Icon className="w-5 h-5 text-sky-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl md:text-3xl font-extrabold text-white leading-none">{value}</div>
                <div className="text-[11px] text-primary-200 mt-1.5 uppercase tracking-widest leading-tight">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        <span className="text-[11px] uppercase tracking-widest">Scroll to explore</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </section>
  )
}

