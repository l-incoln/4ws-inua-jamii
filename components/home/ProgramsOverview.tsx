'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, BookOpen, Sprout, DollarSign, ArrowRight } from 'lucide-react'

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
    stats: '2,000+ served',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
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
    stats: '800+ students',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
  },
  {
    slug: 'economic-empowerment',
    title: 'Economic Empowerment',
    description:
      'Training, microfinancing, and enterprise development programs lifting families out of poverty.',
    icon: DollarSign,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    stats: '500+ businesses',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
  },
  {
    slug: 'environment',
    title: 'Environment',
    description:
      'Tree planting, clean-up drives, and sustainable agriculture preserving Kenya\'s natural heritage.',
    icon: Sprout,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-100',
    stats: '50K trees planted',
    image: 'https://images.unsplash.com/photo-1542601906897-a38c29ee85c6?w=600&q=80',
  },
]

export default function ProgramsOverview() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          {programs.map(({ slug, title, description, icon: Icon, color, bg, border, stats, image }, i) => (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={`/programs/${slug}`} className="group block">
                <div className={`card border ${border} overflow-hidden`}>
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute bottom-3 left-3 badge ${bg} ${color} text-xs font-bold`}>
                      {stats}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                      {description}
                    </p>
                    <span className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${color}`}>
                      Learn more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

