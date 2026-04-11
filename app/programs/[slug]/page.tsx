import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

// Static program data — in production this comes from Supabase
const programsData: Record<string, {
  title: string
  description: string
  fullDescription: string
  image: string
  gallery: string[]
  stats: { label: string; value: string }[]
  objectives: string[]
  howItWorks: string[]
}> = {
  'community-health': {
    title: 'Community Health',
    description: 'Accessible healthcare for all communities.',
    fullDescription: `Our Community Health Program is built on the belief that every person deserves access to quality healthcare regardless of their location or income. We deploy mobile health clinics, trained community health workers, and partner with local hospitals to bring essential medical services directly to underserved communities.

The program covers preventive care, maternal and child health, mental wellness, chronic disease management, and emergency referral systems. We train local health champions who become lasting resources within their own neighborhoods.`,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
      'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=600&q=80',
    ],
    stats: [
      { label: 'People Served', value: '2,000+' },
      { label: 'Health Camps', value: '45' },
      { label: 'Counties', value: '6' },
      { label: 'Health Workers Trained', value: '120' },
    ],
    objectives: [
      'Improve access to primary healthcare in rural and peri-urban areas',
      'Reduce maternal and infant mortality rates',
      'Train community health workers as first-line responders',
      'Create sustainable health awareness through education',
    ],
    howItWorks: [
      'Monthly mobile health clinics deployed to underserved areas',
      'Community health volunteers trained and equipped',
      'Referral networks established with partner hospitals',
      'Health education workshops conducted regularly',
    ],
  },
  'education': {
    title: 'Education & Youth',
    description: 'Empowering youth through learning.',
    fullDescription: `Education is the most powerful tool for breaking the cycle of poverty. Our Education & Youth Program provides scholarships, digital literacy training, mentorship, and after-school support to children and young adults who would otherwise be left behind.

We partner with schools, universities, and digital hubs to create pathways from classroom to career. Our scholarship program covers school fees, uniforms, and learning materials for the most vulnerable students.`,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    ],
    stats: [
      { label: 'Students Supported', value: '800+' },
      { label: 'Scholarships', value: '150' },
      { label: 'Schools Engaged', value: '22' },
      { label: 'Mentors Deployed', value: '60' },
    ],
    objectives: [
      'Eliminate financial barriers to quality education',
      'Bridge the digital divide through tech literacy programs',
      'Connect youth to career opportunities through mentorship',
      'Support vulnerable girls to stay in school',
    ],
    howItWorks: [
      'Annual scholarship selection based on need and merit',
      'Digital literacy hubs established in partner schools',
      'Monthly mentorship sessions with industry professionals',
      'After-school tutoring programs in key subjects',
    ],
  },
  'economic-empowerment': {
    title: 'Economic Empowerment',
    description: 'Lifting communities out of poverty.',
    fullDescription: `Sustainable livelihoods reduce dependency and build community resilience. Our Economic Empowerment Program offers business training, microfinancing, market access, and enterprise support to individuals and groups ready to transform their financial futures.

We work with savings groups, small businesses, and women cooperatives to build financial literacy and connect them to markets, technology, and capital.`,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80',
    ],
    stats: [
      { label: 'Businesses Supported', value: '500+' },
      { label: 'Jobs Created', value: '1,200+' },
      { label: 'Loans Disbursed', value: 'KES 5M' },
      { label: 'Savings Groups', value: '45' },
    ],
    objectives: [
      'Build entrepreneurship skills at community level',
      'Provide access to affordable capital through microfinance',
      'Link small businesses to formal markets',
      'Create sustainable income streams for vulnerable families',
    ],
    howItWorks: [
      '12-week business development training programs',
      'Revolving loan fund for program graduates',
      'Market linkage events connecting producers to buyers',
      'Savings and credit group formation and management',
    ],
  },
  'environment': {
    title: 'Environment',
    description: 'Protecting Kenya\'s natural heritage.',
    fullDescription: `Climate change is one of the greatest threats facing East Africa. Our Environment Program mobilizes communities to take action through tree planting, sustainable agriculture, waste management, and climate education — building resilience from the ground up.

We believe environmental stewardship must come from within communities. By equipping locals with knowledge and resources, we create lasting guardians of Kenya's natural heritage.`,
    image: 'https://images.unsplash.com/photo-1542601906897-a38c29ee85c6?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=600&q=80',
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=600&q=80',
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80',
    ],
    stats: [
      { label: 'Trees Planted', value: '50,000+' },
      { label: 'Clean-up Sites', value: '80+' },
      { label: 'Volunteers', value: '200+' },
      { label: 'Schools Engaged', value: '30' },
    ],
    objectives: [
      'Plant one million trees by 2030',
      'Establish community composting and waste management systems',
      'Promote regenerative agriculture practices',
      'Educate youth on climate change and environmental responsibility',
    ],
    howItWorks: [
      'Quarterly tree planting days across partner communities',
      'Monthly clean-up drives in urban and peri-urban areas',
      'Farmer training on climate-smart agriculture',
      'School environmental clubs and competitions',
    ],
  },
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const program = programsData[params.slug]
  if (!program) return { title: 'Program Not Found' }
  return { title: program.title, description: program.description }
}

export default function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const program = programsData[params.slug]
  if (!program) notFound()

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="relative h-72 md:h-96">
          <Image src={program.image} alt={program.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10">
              <Link href="/programs" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> All Programs
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white">{program.title}</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About the Program</h2>
                {program.fullDescription.split('\n\n').map((para, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed mb-4">{para}</p>
                ))}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Objectives</h2>
                <ul className="space-y-3">
                  {program.objectives.map((obj) => (
                    <li key={obj} className="flex items-start gap-3 text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">How It Works</h2>
                <ol className="space-y-3">
                  {program.howItWorks.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-slate-600">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Gallery */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-3 gap-3">
                  {program.gallery.map((img, i) => (
                    <div key={i} className="relative h-36 rounded-xl overflow-hidden">
                      <Image src={img} alt={`Gallery ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="card p-6">
                <h3 className="font-bold text-slate-900 mb-4">Program Impact</h3>
                <div className="space-y-4">
                  {program.stats.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="font-bold text-primary-700 text-lg">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="card p-6 bg-primary-50 border-primary-100">
                <h3 className="font-bold text-slate-900 mb-2">Get Involved</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Support this program through membership, volunteering, or donations.
                </p>
                <div className="space-y-2">
                  <Link href="/auth/signup" className="btn-primary text-sm w-full justify-center">
                    Join as a Member
                  </Link>
                  <Link href="/donate" className="btn-secondary text-sm w-full justify-center">
                    Donate to this Program
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
