import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Target, TrendingUp } from 'lucide-react'

type Campaign = {
  id: string
  slug: string
  title: string
  description: string | null
  goal: number
  raised: number
  image_url: string | null
  deadline: string | null
}

function formatKES(amount: number) {
  return new Intl.NumberFormat('en-KE', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
}

function daysLeft(deadline: string | null) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export default function DonationProgress({ campaigns = [] }: { campaigns?: Campaign[] }) {
  if (campaigns.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="badge-red text-xs uppercase tracking-widest mb-3 inline-block">
              Active Campaigns
            </span>
            <h2 className="section-title">Fuel the Change</h2>
            <p className="section-subtitle max-w-xl mt-2">
              Your contribution goes directly to programs that transform lives. See the progress in real time.
            </p>
          </div>
          <Link href="/donate" className="btn-secondary shrink-0">
            All Campaigns
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Campaign cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.slice(0, 3).map((campaign) => {
            const pct = campaign.goal > 0 ? Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100) : 0
            const remaining = Math.max(0, campaign.goal - campaign.raised)
            const days = daysLeft(campaign.deadline)

            return (
              <Link
                key={campaign.id}
                href="/donate"
                className="card group hover:shadow-xl transition-shadow duration-300"
              >
                {/* Campaign image */}
                <div className="relative h-44 overflow-hidden bg-slate-100 rounded-t-2xl">
                  {campaign.image_url ? (
                    <Image
                      src={campaign.image_url}
                      alt={campaign.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center">
                      <Target className="w-12 h-12 text-white/40" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 rounded-full px-3 py-1 text-xs font-bold text-primary-600 shadow-sm">
                    {pct}% funded
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {campaign.title}
                  </h3>
                  {campaign.description && (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {campaign.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        KES {formatKES(campaign.raised)}
                      </span>
                      <span className="text-xs text-slate-500">
                        of KES {formatKES(campaign.goal)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-primary-500" />
                        KES {formatKES(remaining)} to go
                      </span>
                      {days !== null && days > 0 && (
                        <span className="text-xs text-amber-800 font-semibold">
                          {days} day{days > 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
                    Donate Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
