import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ArrowRight, Heart, BookOpen, Sprout, DollarSign, Users, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programs',
  description: "Explore 4W'S Inua Jamii Foundation's comprehensive programs transforming communities.",
}

const iconMap: Record<string, LucideIcon> = {
  Heart, BookOpen, Sprout, DollarSign, Users, Globe,
}

const colorSchemes = [
  { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
  { color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-200' },
  { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
] as const

async function getPrograms() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('programs')
    .select('id, slug, title, description, icon, image_url, beneficiaries')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return data ?? []
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

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
            {programs.length === 0 ? (
              <p className="text-center text-slate-500 py-12">No programs found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((program, idx) => {
                  const Icon = iconMap[program.icon ?? ''] ?? Globe
                  const scheme = colorSchemes[idx % colorSchemes.length]
                  return (
                    <div key={program.id} className={`card border-t-4 ${scheme.border}`}>
                      <div className="relative h-52 bg-gray-100">
                        {program.image_url ? (
                          <>
                            <Image src={program.image_url} alt={program.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </>
                        ) : (
                          <div className={`absolute inset-0 ${scheme.bg} flex items-center justify-center`}>
                            <Icon className={`w-16 h-16 ${scheme.color} opacity-30`} />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className={`w-11 h-11 ${scheme.bg} rounded-xl flex items-center justify-center mb-4`}>
                          <Icon className={`w-5 h-5 ${scheme.color}`} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{program.title}</h2>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-3">{program.description}</p>
                        {program.beneficiaries && (
                          <div className="mt-4 py-3 border-t border-b border-gray-100">
                            <div className={`text-lg font-extrabold ${scheme.color}`}>{program.beneficiaries.toLocaleString()}+</div>
                            <div className="text-xs text-slate-400 mt-0.5">Beneficiaries</div>
                          </div>
                        )}
                        <Link
                          href={`/programs/${program.slug}`}
                          className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${scheme.color} hover:gap-2.5 transition-all`}
                        >
                          Learn More <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
