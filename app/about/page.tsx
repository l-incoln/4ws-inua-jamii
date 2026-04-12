import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Target, Eye, Heart, Users, ArrowRight, CheckCircle2, HandHeart, Leaf, BookOpen, Stethoscope, ClipboardList, Megaphone } from 'lucide-react'
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
        {/* Volunteer section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
                  Get Involved
                </span>
                <h2 className="section-title">Volunteer With Us</h2>
                <p className="section-subtitle mt-3">
                  Your time and skills can transform lives. Join 350+ volunteers who give back to
                  Kenyan communities every year.
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    { icon: Stethoscope, label: 'Health Outreach', desc: 'Support medical camps and wellness drives in underserved areas.' },
                    { icon: BookOpen,     label: 'Education Support', desc: 'Tutor students, donate supplies, or mentor youth.' },
                    { icon: Leaf,         label: 'Environmental Projects', desc: 'Tree-planting, clean-ups, and sustainability campaigns.' },
                    { icon: ClipboardList,label: 'Event & Admin Help', desc: 'Coordinate events, manage registrations, and assist operations.' },
                    { icon: Megaphone,    label: 'Community Mobilisation', desc: 'Spread awareness and bring new members into the movement.' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                      <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{label}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link href="/auth/signup" className="btn-primary">
                    <HandHeart className="w-4 h-4" />
                    Become a Volunteer
                  </Link>
                  <Link href="/contact" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary-300 text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors">
                    Ask Us a Question
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="rounded-3xl overflow-hidden h-44 relative">
                      <Image
                        src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80"
                        alt="Volunteers working together"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="rounded-3xl overflow-hidden h-56 relative">
                      <Image
                        src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80"
                        alt="Community health outreach"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="rounded-3xl overflow-hidden h-56 relative">
                      <Image
                        src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600&q=80"
                        alt="Education support"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="rounded-3xl overflow-hidden h-44 relative bg-primary-600 flex flex-col items-center justify-center text-white p-6">
                      <div className="text-4xl font-extrabold">350+</div>
                      <div className="text-sm text-primary-200 mt-1 text-center">Active volunteers across Kenya</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

