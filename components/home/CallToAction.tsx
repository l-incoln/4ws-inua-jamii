'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Users, Star } from 'lucide-react'

export default function CallToAction() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left: Join */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Become a Member
            </h2>
            <p className="text-primary-100 mt-4 leading-relaxed">
              Join thousands of changemakers who are transforming communities across Kenya.
              As a member, you get access to exclusive programs, events, and a powerful network.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                'Access to all foundation programs',
                'Attend exclusive member events',
                'Build a network of changemakers',
                'Track your community impact',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-primary-100">
                  <Star className="w-4 h-4 text-sky-300 flex-shrink-0" />
                  {item}
                </li>
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
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 mx-auto lg:mx-0">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Make a Difference Today
            </h2>
            <p className="text-primary-100 mt-4 leading-relaxed">
              Your donation, no matter the size, creates ripples of change. Support our campaigns
              and help us reach more communities across Kenya and beyond.
            </p>

            {/* Donation amounts */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {['KES 500', 'KES 1,000', 'KES 5,000'].map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass border border-white/20 rounded-xl py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
                >
                  {amount}
                </motion.button>
              ))}
            </div>
            <Link href="/donate" className="mt-5 btn-gold inline-flex w-full lg:w-auto justify-center">
              Donate Now
              <Heart className="w-4 h-4" />
            </Link>

            <p className="mt-4 text-xs text-primary-200">
              All donations are tax-deductible. M-Pesa & card payments accepted.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

