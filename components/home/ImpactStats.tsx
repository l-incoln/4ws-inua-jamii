'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, CalendarCheck, Globe, Heart } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: 5000,
    label: 'Beneficiaries',
    suffix: '+',
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    icon: CalendarCheck,
    value: 120,
    label: 'Events Completed',
    suffix: '+',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    icon: Globe,
    value: 12,
    label: 'Active Programs',
    suffix: '',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    icon: Heart,
    value: 350,
    label: 'Volunteers',
    suffix: '+',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
]

function CountUp({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

export default function ImpactStats() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
            Our Impact
          </span>
          <h2 className="section-title">Numbers That Speak</h2>
          <p className="section-subtitle mx-auto">
            Every number represents a life touched, a community strengthened, and a future
            brightened through collective action.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, label, suffix, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card p-7 text-center group"
            >
              <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <div className={`text-4xl md:text-5xl font-extrabold ${color} mb-1`}>
                <CountUp target={value} />
                {suffix}
              </div>
              <p className="text-slate-600 text-sm font-medium mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

