'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Users, Star } from 'lucide-react'

export default function CallToAction() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F2260 0%, #1E3A8A 40%, #2D5CC8 75%, #4FA3D1 100%)' }}>
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #4FA3D1 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #6DBE45 0%, transparent 70%)', animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04] border border-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full opacity-[0.06] border border-white" />
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Join */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-8 md:p-10 border border-white/15"
          >
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 border border-white/10">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              Become a Member
            </h2>
            <p className="text-blue-100/90 mt-4 leading-relaxed text-sm md:text-base">
              Join thousands of changemakers who are transforming communities across Kenya.
              As a member, you get access to exclusive programs, events, and a powerful network.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                'Access to all foundation programs',
                'Attend exclusive member events',
                'Build a network of changemakers',
                'Track your community impact',
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-2.5 text-sm text-blue-100/90"
                >
                  <Star className="w-4 h-4 text-sky-300 flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
            <Link href="/auth/signup" className="mt-7 btn-gold inline-flex">
              Join the Foundation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right: Donate */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center lg:text-left"
          >
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 mx-auto lg:mx-0 border border-white/10">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              Make a Difference Today
            </h2>
            <p className="text-blue-100/90 mt-4 leading-relaxed text-sm md:text-base">
              Your donation, no matter the size, creates ripples of change. Support our campaigns
              and help us reach more communities across Kenya and beyond.
            </p>

            {/* Donation amounts */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {['KES 500', 'KES 1,000', 'KES 5,000'].map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.22)' }}
                  whileTap={{ scale: 0.96 }}
                  className="glass border border-white/20 rounded-xl py-3 text-sm font-bold text-white transition-colors"
                >
                  {amount}
                </motion.button>
              ))}
            </div>

            <Link href="/donate" className="mt-5 btn-gold inline-flex w-full lg:w-auto justify-center">
              Donate Now
              <Heart className="w-4 h-4" />
            </Link>

            <p className="mt-4 text-xs text-blue-200/70">
              All donations are tax-deductible. M-Pesa &amp; card payments accepted.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

