import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Phone, MapPin, Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return notFound()
  }

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!member) return notFound()

  // Fetch email from auth.users
  let email = ''
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin-client')
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const authUser = users?.find(u => u.id === member.id)
    email = authUser?.email || ''
  } catch { /* admin client optional */ }

  // Fetch RSVP count
  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('user_id')
    .eq('user_id', member.id)
    .eq('status', 'confirmed')
  const rsvpCount = rsvps?.length || 0

  // Fetch membership terms
  const { data: terms } = await supabase
    .from('membership_terms')
    .select('*')
    .eq('user_id', member.id)
    .order('created_at', { ascending: false })

  // Fetch badges
  const { data: badges } = await supabase
    .from('member_badges')
    .select('*')
    .eq('user_id', member.id)

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-sky-100 text-sky-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const tierColors: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    champion: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/members"
          className="p-2 rounded-lg bg-white border border-gray-200 text-slate-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Profile</h1>
          <p className="text-slate-500 text-sm">View detailed member information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold flex-shrink-0">
            {member.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '??'}
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{member.full_name || 'Unknown'}</h2>
              <p className="text-slate-500 text-sm">{email || 'No email'}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[member.membership_status] || 'bg-gray-100 text-gray-700'}`}>
                {member.membership_status || 'pending'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierColors[member.tier] || 'bg-gray-100 text-gray-700'}`}>
                {member.tier || 'basic'}
              </span>
              {member.role === 'admin' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{rsvpCount}</div>
              <div className="text-xs text-slate-500">Events</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{badges?.length || 0}</div>
              <div className="text-xs text-slate-500">Badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Phone</div>
              <div className="text-slate-900">{member.phone || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Location</div>
              <div className="text-slate-900">{member.location || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Joined</div>
              <div className="text-slate-900">
                {new Date(member.created_at).toLocaleDateString('en-KE', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Payment Confirmed</div>
              <div className="text-slate-900">
                {member.payment_confirmed ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400">
                    <XCircle className="w-4 h-4" /> No
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Terms */}
      {terms && terms.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Membership Terms</h3>
          <div className="space-y-3">
            {terms.map((term) => (
              <div
                key={term.id}
                className={`p-4 rounded-lg border ${
                  term.is_active
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {term.is_active ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="font-medium text-slate-900">
                      {term.is_active ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(term.valid_until).toLocaleDateString('en-KE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.id}
                className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700"
              >
                {badge.badge_type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}