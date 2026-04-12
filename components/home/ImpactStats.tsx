'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, CalendarCheck, Globe, Heart } from 'lucide-react'

type Metric = {
  id: string
  label: string
  value: number
  unit: string
  icon: string
}

const fallbackStats = [
  { icon: Users,         value: 5000, label: 'Lives Touched',    suffix: '+', accent: 'from-sky-400 to-sky-300',  ring: 'ring-sky-400/30' },
  { icon: CalendarCheck, value: 120,  label: 'Events Completed', suffix: '+', accent: 'from-green-400 to-green-300', ring: 'ring-green-400/30' },
  { icon: Globe,         value: 12,   label: 'Active Programs',  suffix: '',  accent: 'from-gold-400 to-gold-300', ring: 'ring-gold-400/30' },
  { icon: Heart,         value: 350,  label: 'Volunteers',       suffix: '+', accent: 'from-rose-400 to-rose-300', ring: 'ring-rose-400/30' },
]

const accentCycle = [
  { accent: 'from-sky-400 to-sky-300',   ring: 'ring-sky-400/30',   icon: Users },
  { accent: 'from-green-400 to-green-300', ring: 'ring-green-400/30', icon: CalendarCheck },
  { accent: 'from-gold-400 to-gold-300', ring: 'ring-gold-400/30',  icon: Globe },
  { accent: 'from-rose-400 to-rose-300', ring: 'ring-rose-400/30',  icon: Heart },
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

export default function ImpactStats({ metrics = [] }: { metrics?: Metric[] }) {
  // Build stats from DB data, falling back to hardcoded values
  const stats = metrics.length > 0
    ? metrics.map((m, i) => ({
        icon: accentCycle[i % accentCycle.length].icon,
        value: m.value,
        label: m.label,
        suffix: m.unit || '',
        accent: accentCycle[i % accentCycle.length].accent,
        ring: accentCycle[i % accentCycle.length].ring,
      }))
    : fallbackStats

  return (
    <section className="relative py-20 md:py-28 overflow-hidden noise-overlay">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-cta-gradient" />

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, #4FA3D1, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15"
          style={{ background: 'radial-gradient(circle, #6DBE45, transparent 70%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 glass border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 uppercase tracking-widest mb-4">
            Our Impact
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Numbers That <span className="bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">Speak</span>
          </h2>
          <p className="mt-4 text-base text-primary-100/80 max-w-xl mx-auto leading-relaxed">
            Every number represents a life touched, a community strengthened, and a future brightened.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(({ icon: Icon, value, label, suffix, accent, ring }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`glass border border-white/10 rounded-3xl p-7 text-center group hover:bg-white/10 transition-all duration-300 ring-1 ${ring}`}
            >
              {/* Gradient icon bubble */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <Icon className="w-7 h-7 text-white drop-shadow" />
              </div>

              {/* Number */}
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-1 tabular-nums">
                <CountUp target={value} />
                {suffix}
              </div>
              <p className="text-primary-200 text-sm font-medium mt-1.5 leading-tight">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


