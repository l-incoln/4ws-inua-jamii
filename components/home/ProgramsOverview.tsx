'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, BookOpen, Sprout, DollarSign, ArrowRight } from 'lucide-react'

interface Props {
  dbImages?: Record<string, string>
}

const programs = [
  {
    slug: 'community-health',
    title: 'Community Health',
    description:
      'Providing accessible healthcare services, health education, and wellness programs to underserved communities.',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    glow: 'card-glow-rose',
    accentBar: 'from-rose-500 to-rose-400',
    stats: '2,000+ served',
    image: 'https://images.pexels.com/photos/937783/pexels-photo-937783.jpeg',
  },
  {
    slug: 'education',
    title: 'Education',
    description:
      'Scholarships, mentorship, and learning resources empowering youth to achieve their full potential.',
    icon: BookOpen,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    glow: 'card-glow-sky',
    accentBar: 'from-sky-500 to-sky-400',
    stats: '800+ students',
    image: 'https://images.pexels.com/photos/1667853/pexels-photo-1667853.jpeg',
  },
  {
    slug: 'economic-empowerment',
    title: 'Economic Empowerment',
    description:
      'Training, microfinancing, and enterprise development programs lifting families out of poverty.',
    icon: DollarSign,
    color: 'text-gold-600',
    bg: 'bg-gold-50',
    border: 'border-gold-100',
    glow: 'card-glow-gold',
    accentBar: 'from-gold-500 to-gold-400',
    stats: '500+ businesses',
    image: 'https://images.pexels.com/photos/325718/pexels-photo-325718.jpeg',
  },
  {
    slug: 'environment',
    title: 'Environment',
    description:
      'Tree planting, clean-up drives, and sustainable agriculture preserving Kenya\'s natural heritage.',
    icon: Sprout,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    glow: 'card-glow-green',
    accentBar: 'from-green-500 to-green-400',
    stats: '50K trees planted',
    image: 'https://images.pexels.com/photos/3185488/pexels-photo-3185488.jpeg',
  },
]

export default function ProgramsOverview({ dbImages = {} }: Props) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map(({ slug, title, description, icon: Icon, color, bg, border, glow, accentBar, stats, image: fallbackImage }, i) => {
            const image = dbImages[slug] || fallbackImage
            return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
            >
              <Link href={`/programs/${slug}`} className="group block h-full">
                <div className={`card-elevated border ${border} ${glow} overflow-hidden h-full flex flex-col relative`}>
                  {/* Colored bottom accent bar that expands on hover */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${accentBar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden shrink-0">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)' }} />
                    <div className={`absolute top-3 right-3 w-9 h-9 ${bg} rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="absolute bottom-3 left-3 badge bg-white/90 text-slate-700 shadow text-xs font-bold">
                      {stats}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className={`font-extrabold text-slate-900 group-hover:${color} transition-colors text-base duration-200`}>
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3 flex-1">
                      {description}
                    </p>
                    <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${color} group-hover:gap-3 transition-all duration-200`}>
                      Explore <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )})}
        </div>
      </div>
    </section>
  )
}
