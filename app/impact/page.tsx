import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import PageBackLink from '@/components/layout/PageBackLink'
import {
  Users, CalendarCheck, Heart, Package, Globe, TrendingUp,
  Award, ArrowRight, MapPin,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Impact Dashboard | 4W\'S Inua Jamii Foundation',
  description: 'Transparency in action — real-time data on beneficiaries reached, donations received, events conducted, and community impact.',
}

interface DistributionRecord {
  id: string
  title: string
  category: string
  quantity: number
  unit: string
  beneficiaries: number
  location: string | null
  distribution_date: string
}

interface OutreachActivity {
  id: string
  title: string
  description: string | null
  activity_type: string
  location: string | null
  participants: number
  beneficiaries: number
  activity_date: string
  status: string
  image_url: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food',
  clothing: 'Clothing',
  materials: 'Materials',
  medical: 'Medical Supplies',
  educational: 'Educational Materials',
  other: 'Other',
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍚',
  clothing: '👕',
  materials: '📦',
  medical: '⚕️',
  educational: '📚',
  other: '🎁',
}

const OUTREACH_TYPE_LABELS: Record<string, string> = {
  community_visit: 'Community Visit',
  health_camp: 'Health Camp',
  education_drive: 'Education Drive',
  environmental: 'Environmental Action',
  fundraiser: 'Fundraiser',
  awareness_campaign: 'Awareness Campaign',
  other: 'Other',
}

export default async function ImpactDashboardPage() {
  const supabase = await createClient()

  // Fetch all real impact data in parallel
  const [
    donationsRes, eventsRes, programsRes, volunteersRes, membersRes,
    distributionsRes, outreachRes, impactMetricsRes,
  ] = await Promise.all([
    // Total donations received (completed)
    supabase
      .from('donations')
      .select('amount')
      .eq('status', 'completed'),
    // Events conducted
    supabase
      .from('events')
      .select('id, status'),
    // Programs + beneficiaries
    supabase
      .from('programs')
      .select('id, title, beneficiaries, is_active'),
    // Dynamic volunteer count
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'volunteer'),
    // Total approved members
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('membership_status', 'approved'),
    // Distribution records
    supabase
      .from('distribution_records')
      .select('*')
      .order('distribution_date', { ascending: false })
      .limit(20),
    // Outreach activities
    supabase
      .from('outreach_activities')
      .select('*')
      .order('activity_date', { ascending: false })
      .limit(12),
    // CMS-managed impact metrics
    supabase
      .from('impact_metrics')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  // Compute real totals
  const totalDonations = (donationsRes.data ?? []).reduce((s, d) => s + Number(d.amount), 0)
  const totalDonationCount = donationsRes.data?.length ?? 0
  const eventsConducted = (eventsRes.data ?? []).filter((e) => e.status === 'completed').length
  const totalEvents = eventsRes.data?.length ?? 0
  const totalBeneficiaries = (programsRes.data ?? []).reduce((s, p) => s + (p.beneficiaries ?? 0), 0)
  const activePrograms = (programsRes.data ?? []).filter((p) => p.is_active).length
  const volunteerCount = volunteersRes.count ?? 0
  const memberCount = membersRes.count ?? 0

  // Distribution totals
  const distributions = (distributionsRes.data ?? []) as unknown as DistributionRecord[]
  const totalDistributedBeneficiaries = distributions.reduce((s, d) => s + d.beneficiaries, 0)
  const distributionByCategory = Object.entries(
    distributions.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + d.quantity
      return acc
    }, {} as Record<string, number>)
  )

  // Outreach totals
  const outreachActivities = (outreachRes.data ?? []) as unknown as OutreachActivity[]
  const totalOutreachBeneficiaries = outreachActivities.reduce((s, a) => s + a.beneficiaries, 0)
  const totalOutreachParticipants = outreachActivities.reduce((s, a) => s + a.participants, 0)

  // CMS impact metrics
  const cmsMetrics = impactMetricsRes.data ?? []

  // Key stats cards
  const keyStats = [
    { label: 'Total Donations Received', value: `KES ${totalDonations.toLocaleString()}`, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', sub: `${totalDonationCount} donations` },
    { label: 'Beneficiaries Reached', value: totalBeneficiaries.toLocaleString(), icon: Users, color: 'text-sky-600', bg: 'bg-sky-50', sub: `across ${activePrograms} active programs` },
    { label: 'Events Conducted', value: eventsConducted.toString(), icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${totalEvents} total events` },
    { label: 'Volunteers Involved', value: volunteerCount.toString(), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', sub: `${memberCount} approved members` },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-4">
              <TrendingUp className="w-3.5 h-3.5" /> Transparency &amp; Impact
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Impact Dashboard</h1>
            <p className="mt-4 text-lg text-primary-100/80 max-w-2xl mx-auto leading-relaxed">
              Real-time data on how 4W&apos;S Inua Jamii Foundation is transforming communities.
              Every number represents a life touched and a future brightened.
            </p>
          </div>
        </div>
      </div>

      {/* Section navigation */}
      <div className="sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-3 text-sm font-medium">
            <a href="#overview" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap transition-colors">Overview</a>
            <a href="#foundation" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap transition-colors">Foundation Impact</a>
            <a href="#distributions" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap transition-colors">Distributions</a>
            <a href="#outreach" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap transition-colors">Outreach</a>
            <a href="#get-involved" className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-primary-50 hover:text-primary-700 whitespace-nowrap transition-colors">Get Involved</a>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <PageBackLink href="/" label="Back to Home" className="!px-0 !pt-0" />
        {/* Key stats */}
        <section id="overview" className="scroll-mt-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {keyStats.map(({ label, value, icon: Icon, color, bg, sub }) => (
            <div key={label} className="card p-6">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        </section>

        {/* CMS-managed impact metrics (if any) */}
        {cmsMetrics.length > 0 && (
          <section id="foundation" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Foundation Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cmsMetrics.map((m) => (
                <div key={m.id} className="card p-6 text-center">
                  <div className="text-3xl mb-2">{m.icon ?? '📊'}</div>
                  <p className="text-3xl font-extrabold text-primary-600">{m.value.toLocaleString()}{m.unit ?? ''}</p>
                  <p className="text-sm text-slate-500 mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Distribution tracking */}
        <section id="distributions" className="scroll-mt-32">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Distributions</h2>
              <p className="text-sm text-slate-500 mt-1">Food, clothing, materials, and supplies distributed to communities</p>
            </div>
          </div>

          {/* Distribution summary by category */}
          {distributionByCategory.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {distributionByCategory.map(([category, qty]) => (
                <div key={category} className="card p-4 text-center">
                  <div className="text-2xl mb-1">{CATEGORY_ICONS[category] ?? '📦'}</div>
                  <p className="text-xl font-bold text-slate-900">{qty.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{CATEGORY_LABELS[category] ?? category}</p>
                </div>
              ))}
            </div>
          )}

          {totalDistributedBeneficiaries > 0 && (
            <div className="card p-4 mb-6 bg-emerald-50 border-emerald-100">
              <p className="text-sm text-emerald-800">
                <strong>{totalDistributedBeneficiaries.toLocaleString()}</strong> beneficiaries reached through distribution programs
              </p>
            </div>
          )}

          {/* Recent distributions */}
          {distributions.length > 0 ? (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Recent Distributions</h3>
              <div className="space-y-3">
                {distributions.slice(0, 8).map((d) => (
                  <div key={d.id} className="flex items-center gap-4 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="text-2xl flex-shrink-0">{CATEGORY_ICONS[d.category] ?? '📦'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{d.title}</p>
                      <p className="text-xs text-slate-500">
                        {d.quantity.toLocaleString()} {d.unit} · {d.beneficiaries} beneficiaries
                        {d.location && ` · ${d.location}`}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(d.distribution_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm text-slate-500">No distribution records yet. Records will appear here as the foundation conducts distribution activities.</p>
            </div>
          )}
        </section>

        {/* Outreach activities */}
        <section id="outreach" className="scroll-mt-32">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Outreach Activities</h2>
              <p className="text-sm text-slate-500 mt-1">Community visits, health camps, education drives, and awareness campaigns</p>
            </div>
          </div>

          {totalOutreachBeneficiaries > 0 && (
            <div className="card p-4 mb-6 bg-sky-50 border-sky-100">
              <p className="text-sm text-sky-800">
                <strong>{totalOutreachBeneficiaries.toLocaleString()}</strong> beneficiaries reached · <strong>{totalOutreachParticipants.toLocaleString()}</strong> participants engaged through outreach
              </p>
            </div>
          )}

          {outreachActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outreachActivities.map((a) => (
                <div key={a.id} className="card p-5">
                  {a.image_url && (
                    <img src={a.image_url} alt={a.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-gray text-xs">{OUTREACH_TYPE_LABELS[a.activity_type] ?? a.activity_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      a.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                      a.status === 'planned' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{a.status}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{a.title}</h3>
                  {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    {a.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location}</span>}
                    <span>{a.beneficiaries} beneficiaries</span>
                    <span>{a.participants} participants</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(a.activity_date).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-sm text-slate-500">No outreach activities recorded yet. Activities will appear here as the foundation conducts outreach programs.</p>
            </div>
          )}
        </section>

        {/* CTA */}
        <section id="get-involved" className="scroll-mt-32">
        <div className="card p-8 bg-hero-gradient text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Want to Be Part of the Impact?</h2>
          <p className="text-primary-100/80 text-sm mb-6 max-w-xl mx-auto">
            Join our community of changemakers. Every contribution — whether time, talent, or treasure — makes a measurable difference.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/donate" className="btn-sky text-sm">Make a Donation</Link>
            <Link href="/events" className="btn-secondary text-sm">Join an Event</Link>
            <Link href="/contact" className="btn-secondary text-sm">Get Involved</Link>
          </div>
        </div>
        </section>
      </div>
    </div>
  )
}

