import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Shield, Star, Award, CalendarDays, Users, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .eq('membership_status', 'approved')
    .maybeSingle()
  return {
    title: data?.full_name ? `${data.full_name} | Member Profile` : 'Member Profile',
  }
}

const TIER_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string; badge: string }> = {
  basic:    { label: 'Classic Member',  icon: Shield, gradient: 'from-sky-500 to-blue-600',        badge: 'bg-sky-100 text-sky-700' },
  active:   { label: 'Premium Member',  icon: Star,   gradient: 'from-green-500 to-emerald-600',   badge: 'bg-green-100 text-green-700' },
  champion: { label: 'Gold Member',     icon: Award,  gradient: 'from-amber-400 to-orange-600',    badge: 'bg-amber-100 text-amber-700' },
}

export default async function PublicMemberProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url, location, tier, role, created_at')
    .eq('id', id)
    .eq('membership_status', 'approved')
    .maybeSingle()

  if (!profile) notFound()

  // Count RSVPs (event participation)
  const { count: eventsCount } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('status', 'confirmed')

  // Active membership term
  const { data: activeTerm } = await supabase
    .from('membership_terms')
    .select('tier, valid_from, valid_until')
    .eq('user_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const config = TIER_CONFIG[profile.tier] ?? TIER_CONFIG.basic
  const TierIcon = config.icon

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-KE', {
    month: 'long', year: 'numeric',
  })

  const ROLE_LABELS: Record<string, string> = {
    member: 'Member', volunteer: 'Volunteer', admin: 'Administrator',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${config.gradient} py-12 px-4`}>
        <div className="max-w-2xl mx-auto text-center relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-4 border-white/40 mx-auto mb-4 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <TierIcon className="w-10 h-10 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
          <p className="text-white/80 mt-1">{ROLE_LABELS[profile.role] ?? 'Member'}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 text-white text-sm px-4 py-1.5 rounded-full">
            <TierIcon className="w-4 h-4" />
            {config.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{eventsCount ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Events attended</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-900">{config.label.split(' ')[0]}</p>
            <p className="text-xs text-slate-500 mt-1">Membership tier</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-900">{joinedDate.split(' ')[1]}</p>
            <p className="text-xs text-slate-500 mt-1">Joined</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-2">About</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-900">Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              Member since {joinedDate}
            </div>
            {profile.location && (
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {profile.location}
              </div>
            )}
            {activeTerm && (
              <div className="flex items-center gap-3 text-slate-600">
                <TierIcon className="w-4 h-4 text-slate-400" />
                Active until{' '}
                {new Date(activeTerm.valid_until).toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              {eventsCount ?? 0} events attended
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 space-y-1">
          <p>This is a public member profile of</p>
          <Link href="/" className="font-semibold text-slate-700 hover:text-primary-600">
            4W&apos;S Inua Jamii Foundation
          </Link>
        </div>
      </div>
    </div>
  )
}
