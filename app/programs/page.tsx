import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ArrowRight, Heart, BookOpen, Sprout, DollarSign, Users, Globe } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programs',
  description: 'Explore 4W\'S Inua Jamii Foundation\'s comprehensive programs transforming communities.',
}

const programs = [
  {
    slug: 'community-health',
    icon: Heart,
    title: 'Community Health',
    description: 'Providing accessible healthcare services, health education, maternal care, and wellness programs to underserved communities across Kenya.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    stats: [{ label: 'People Served', value: '2,000+' }, { label: 'Health Camps', value: '45' }, { label: 'Counties', value: '6' }],
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    slug: 'education',
    icon: BookOpen,
    title: 'Education & Youth',
    description: 'Scholarships, mentorship programs, digital literacy, and learning resources empowering the next generation to achieve their full potential.',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    stats: [{ label: 'Students Supported', value: '800+' }, { label: 'Scholarships', value: '150' }, { label: 'Schools', value: '22' }],
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    slug: 'economic-empowerment',
    icon: DollarSign,
    title: 'Economic Empowerment',
    description: 'Business training, microfinancing, market linkages, and enterprise development programs lifting families out of poverty.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    stats: [{ label: 'Businesses Supported', value: '500+' }, { label: 'Jobs Created', value: '1,200+' }, { label: 'Loans Disbursed', value: 'KES 5M' }],
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    slug: 'environment',
    icon: Sprout,
    title: 'Environment',
    description: 'Tree planting campaigns, clean-up drives, sustainable agriculture, and climate change awareness preserving Kenya\'s natural heritage.',
    image: 'https://images.unsplash.com/photo-1542601906897-a38c29ee85c6?w=800&q=80',
    stats: [{ label: 'Trees Planted', value: '50,000+' }, { label: 'Clean-up Sites', value: '80+' }, { label: 'Volunteers', value: '200+' }],
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-200',
  },
  {
    slug: 'women-empowerment',
    icon: Users,
    title: 'Women Empowerment',
    description: 'Skills training, financial literacy, leadership development, and support networks empowering women to lead and thrive.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
    stats: [{ label: 'Women Reached', value: '1,000+' }, { label: 'Groups Formed', value: '35' }, { label: 'Trained', value: '650+' }],
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    slug: 'community-infrastructure',
    icon: Globe,
    title: 'Community Infrastructure',
    description: 'Water access, sanitation facilities, community centers, and sustainable infrastructure improving quality of life.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    stats: [{ label: 'Projects Completed', value: '18' }, { label: 'Households Benefited', value: '3,000+' }, { label: 'Wells Drilled', value: '12' }],
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
]

export default function ProgramsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              What We Do
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Our <span className="text-sky-400">Programs</span>
            </h1>
            <p className="mt-5 text-lg text-primary-100 max-w-2xl mx-auto">
              Comprehensive initiatives targeting the root causes of community challenges,
              creating sustainable pathways to prosperity.
            </p>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs.map(({ slug, icon: Icon, title, description, image, stats, color, bg, border }) => (
                <div key={slug} className={`card border-t-4 ${border}`}>
                  <div className="relative h-52">
                    <Image src={image} alt={title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-3">{description}</p>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2 py-4 border-t border-b border-gray-100">
                      {stats.map(({ label, value }) => (
                        <div key={label} className="text-center">
                          <div className={`text-lg font-extrabold ${color}`}>{value}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/programs/${slug}`}
                      className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${color} hover:gap-2.5 transition-all`}
                    >
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Link>
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

