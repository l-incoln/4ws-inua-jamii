import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Target, Eye, Heart, Users, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the mission, vision, and leadership of 4W\'S Inua Jamii Foundation.',
}

const values = [
  { icon: Heart, title: 'Compassion', description: 'We lead with empathy, listening to the needs of every community we serve.' },
  { icon: Users, title: 'Unity', description: 'Stronger together. We believe collective action creates lasting change.' },
  { icon: CheckCircle2, title: 'Integrity', description: 'Transparency and accountability in all our operations and partnerships.' },
  { icon: Target, title: 'Impact', description: 'Every initiative is measured by the tangible difference it makes in lives.' },
]

const leadership = [
  {
    name: 'Dr. Mary Wanjiku',
    role: 'Executive Director',
    bio: 'With 15 years in community development, Dr. Wanjiku leads our strategic vision and operations.',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80',
  },
  {
    name: 'James Kamau',
    role: 'Programs Director',
    bio: 'James oversees all foundation programs ensuring maximum community impact and sustainability.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  },
  {
    name: 'Fatuma Hassan',
    role: 'Finance & Operations',
    bio: 'Fatuma ensures the foundation\'s financial health and operational excellence.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
  },
  {
    name: 'Peter Ochieng',
    role: 'Community Liaison',
    bio: 'Peter bridges the gap between the foundation and the communities we serve across Kenya.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              Our Story
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white">
              About <span className="text-sky-400">4W&apos;S Inua Jamii</span>
            </h1>
            <p className="mt-5 text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Founded on the belief that every community deserves to thrive, we combine grassroots
              passion with strategic programming to create lasting transformation.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section id="mission" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="card p-8 border-l-4 border-primary-600">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  To empower underprivileged communities across Kenya through sustainable programs
                  in health, education, economic development, and environmental stewardship —
                  fostering dignity, resilience, and self-sufficiency.
                </p>
              </div>
              <div className="card p-8 border-l-4 border-sky-500">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6 text-sky-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Vision</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  A Kenya where every community has the resources, knowledge, and opportunities to
                  thrive — where no child goes without education, no family without healthcare,
                  and no environment without care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-80 lg:h-auto rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"
                  alt="Community impact"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="text-3xl font-extrabold">Est. 2018</div>
                  <div className="text-sm text-primary-200">Nairobi, Kenya</div>
                </div>
              </div>
              <div>
                <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
                  Our Journey
                </span>
                <h2 className="section-title">From a Small Group to a Big Movement</h2>
                <div className="mt-5 space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    4W&apos;S Inua Jamii Foundation was born in 2018 from a simple conviction held
                    by a group of four friends: that wealth, wisdom, will, and work — our four W&apos;s
                    — when combined with community spirit, can transform any situation.
                  </p>
                  <p>
                    What started as neighborhood clean-up drives and school supply donations has
                    grown into a full-scale foundation running 12 active programs, serving over
                    5,000 beneficiaries annually, with a growing family of 350+ dedicated volunteers.
                  </p>
                  <p>
                    Today, we operate with a professional team, transparent governance, and a
                    passionate community of members and donors who believe in our mission.
                  </p>
                </div>
                <Link href="/auth/signup" className="btn-primary mt-7 inline-flex">
                  Be Part of the Story
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
                What Drives Us
              </span>
              <h2 className="section-title">Our Core Values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map(({ icon: Icon, title, description }) => (
                <div key={title} className="card p-6 text-center">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section id="leadership" className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
                The Team
              </span>
              <h2 className="section-title">Our Leadership</h2>
              <p className="section-subtitle mx-auto">
                Dedicated professionals committed to driving meaningful change.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {leadership.map(({ name, role, bio, image }) => (
                <div key={name} className="card overflow-hidden group">
                  <div className="relative h-64">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="font-bold">{name}</div>
                      <div className="text-xs text-primary-200">{role}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-500 leading-relaxed">{bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

