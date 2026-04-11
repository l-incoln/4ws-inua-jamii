'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play, ChevronDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400 rounded-full blur-3xl opacity-10"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-400 rounded-full blur-3xl opacity-10"
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass border border-white/20 rounded-full px-5 py-2 text-sm text-white/90 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Transforming Communities Across Kenya
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight"
          >
            Building{' '}
            <span className="relative">
              <span className="text-sky-400">Stronger</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-sky-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
            </span>
            <br />
            Communities Together
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-7 text-lg md:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed"
          >
            4W&apos;S Inua Jamii Foundation unites passionate individuals to uplift communities
            through health, education, economic empowerment, and environmental stewardship.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/signup" className="btn-gold text-base px-8 py-4 w-full sm:w-auto">
              Join the Movement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2.5 text-white/90 hover:text-white transition-colors text-sm font-semibold group"
            >
              <div className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play className="w-4 h-4 fill-current" />
              </div>
              Watch Our Story
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14"
          >
            {[
              { value: '5,000+', label: 'Beneficiaries' },
              { value: '12', label: 'Programs' },
              { value: '350+', label: 'Volunteers' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{value}</div>
                <div className="text-xs text-primary-200 mt-0.5 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50"
      >
        <span className="text-xs">Scroll to explore</span>
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  )
}

