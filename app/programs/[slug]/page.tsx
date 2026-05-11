import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Heart, BookOpen, Sprout, DollarSign, Users, Globe, ArrowLeft, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createPublicClient } from '@/lib/supabase/public-client'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ProgramApplySection from '@/components/programs/ProgramApplySection'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string } }

const iconMap: Record<string, LucideIcon> = {
  Heart, BookOpen, Sprout, DollarSign, Users, Globe,
}

async function getProgram(slug: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('programs')
    .select('id, slug, title, description, icon, image_url, beneficiaries')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = await getProgram(params.slug)
  if (!program) return { title: 'Program Not Found' }
  return { title: program.title, description: program.description }
}

export default async function ProgramDetailPage({ params }: Props) {
  const program = await getProgram(params.slug)
  if (!program) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user already applied
  let existingStatus: string | null = null
  if (user) {
    const { data: app } = await supabase
      .from('program_applications')
      .select('status')
      .eq('program_id', program.id)
      .eq('user_id', user.id)
      .maybeSingle()
    existingStatus = app?.status ?? null
  }

  const Icon = iconMap[program.icon ?? ''] ?? Globe

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="relative h-72 md:h-96">
          {program.image_url ? (
            <Image src={program.image_url} alt={program.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-primary-900 flex items-center justify-center">
              <Icon className="w-24 h-24 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10">
              <Link href="/programs" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> All Programs
              </Link>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white max-w-3xl">{program.title}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Program</h2>
            {(program.description ?? '').split('\n\n').map((para: string, i: number) => (
              <p key={i} className="text-slate-600 leading-relaxed mb-4">{para}</p>
            ))}
          </div>

          {/* Beneficiaries stat */}
          {program.beneficiaries && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8 text-center">
              <div className="text-5xl font-extrabold text-primary-700">{program.beneficiaries.toLocaleString()}+</div>
              <div className="text-slate-600 mt-2">Beneficiaries Served</div>
            </div>
          )}

          {/* Apply to Program */}
          <ProgramApplySection
            programId={program.id}
            programTitle={program.title}
            isLoggedIn={!!user}
            existingStatus={existingStatus}
          />

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary-700 to-sky-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Get Involved</h3>
            <p className="text-primary-100 mb-6 max-w-lg mx-auto">
              Support this program through volunteering, donations, or partnerships. Every contribution makes a difference.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/donate" className="btn-secondary bg-white text-primary-700 hover:bg-gray-50 inline-flex items-center gap-2">
                Donate <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/events" className="btn border border-white/40 text-white hover:bg-white/10 inline-flex items-center gap-2">
                Volunteer
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
