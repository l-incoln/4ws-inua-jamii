'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Heart, BookOpen, Sprout, DollarSign, Users, Globe,
  ArrowRight, type LucideIcon,
} from 'lucide-react'

/** Shape of a program card as passed from the server. */
export interface ProgramCardData {
  slug: string
  title: string
  description?: string | null
  icon?: string | null
  image_url?: string | null
  beneficiaries?: number | null
}

interface Props {
  programs?: ProgramCardData[]
}

// Icon name → component map (matches app/programs/page.tsx)
const iconMap: Record<string, LucideIcon> = {
  Heart, BookOpen, Sprout, DollarSign, Users, Globe,
}

// Color schemes cycled by index (matches app/programs/page.tsx + adds glow/accent)
const colorSchemes = [
  { color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',    glow: 'card-glow-rose',    accentBar: 'from-rose-500 to-rose-400' },
  { color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100',     glow: 'card-glow-sky',     accentBar: 'from-sky-500 to-sky-400' },
  { color: 'text-gold-600',    bg: 'bg-gold-50',    border: 'border-gold-100',    glow: 'card-glow-gold',    accentBar: 'from-gold-500 to-gold-400' },
  { color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-100',   glow: 'card-glow-green',   accentBar: 'from-green-500 to-green-400' },
  { color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100',  glow: 'card-glow-purple',  accentBar: 'from-purple-500 to-purple-400' },
  { color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100',    glow: 'card-glow-teal',    accentBar: 'from-teal-500 to-teal-400' },
] as const

function formatStats(beneficiaries?: number | null): string | null {
  if (!beneficiaries || beneficiaries <= 0) return null
  if (beneficiaries >= 1000) {
    const k = beneficiaries / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K+ served`
  }
  return `${beneficiaries.toLocaleString()}+ served`
}

export default function ProgramsOverview({ programs = [] }: Props) {
  // If the DB returned programs, use them. Otherwise fall back to an empty
  // state — the admin controls all content now.
  const cards = programs.slice(0, 8) // cap at 8 for homepage layout

  return (
    <section className="py-16 md:py-24 relative overflow-hidden section-accent-bar" style={{ background: 'linear-gradient(180deg, #F8FAFF 0%, #EEF4FF 100%)' }}>
      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #1E3A8A 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
              What We Do
            </span>
            <h2 className="section-title">Our Programs</h2>
            <p className="section-subtitle max-w-xl mt-2">
              Comprehensive programs targeting the root causes of community challenges.
            </p>
          </div>
          <Link href="/programs" className="btn-secondary shrink-0">
            View All Programs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Programs Grid */}
        {cards.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Programs will appear here once published.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((program, i) => {
              const scheme = colorSchemes[i % colorSchemes.length]
              const Icon = iconMap[program.icon ?? ''] ?? Globe
              const stats = formatStats(program.beneficiaries)
              const image = program.image_url
              return (
                <motion.div
                  key={program.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <Link href={`/programs/${program.slug}`} className="group block h-full">
                    <div className={`card-elevated border ${scheme.border} ${scheme.glow} overflow-hidden h-full flex flex-col relative`}>
                      {/* Colored bottom accent bar that expands on hover */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.accentBar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                      {/* Image */}
                      <div className="relative h-48 overflow-hidden shrink-0">
                        {image ? (
                          <Image
                            src={image}
                            alt={program.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className={`absolute inset-0 ${scheme.bg} flex items-center justify-center`}>
                            <Icon className={`w-16 h-16 ${scheme.color} opacity-30`} />
                          </div>
                        )}
                        {image && (
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)' }} />
                        )}
                        <div className={`absolute top-3 right-3 w-9 h-9 ${scheme.bg} rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-4 h-4 ${scheme.color}`} />
                        </div>
                        {stats && (
                          <span className="absolute bottom-3 left-3 badge bg-white/90 text-slate-700 shadow text-xs font-bold">
                            {stats}
                          </span>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className={`font-extrabold text-slate-900 group-hover:${scheme.color} transition-colors text-base duration-200`}>
                          {program.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3 flex-1">
                          {program.description}
                        </p>
                        <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${scheme.color} group-hover:gap-3 transition-all duration-200`}>
                          Explore <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
