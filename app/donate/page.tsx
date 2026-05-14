import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DonateForm from '@/components/donate/DonateForm'
import { createClient } from '@/lib/supabase/server'
import { Heart, Shield, Zap, Users2 } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support 4W\'S Inua Jamii Foundation and help transform communities across Kenya.',
}

const defaultImpactAmounts = [
  { amount: 500, impact: 'Feeds a family for a week during our food support program' },
  { amount: 1000, impact: 'Buys a full term\'s school supplies for one child' },
  { amount: 2500, impact: 'Funds a community health screening for 5 people' },
  { amount: 5000, impact: 'Supports a woman\'s business training for one month' },
  { amount: 10000, impact: 'Plants 100 trees in a reforestation site' },
]

export default async function DonatePage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('donation_campaigns')
    .select('id, title, description, goal, raised, image_url, deadline')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'mpesa_paybill', 'mpesa_account', 'min_donation_amount', 'donation_thank_you_message', 'donation_currency',
      'donate_hero_title', 'donate_hero_subtitle', 'donate_impact_amounts',
    ])

  const sv = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value ?? '']))

  const donateHeroTitle    = sv.donate_hero_title    || 'Your Donation <span>Changes Lives</span>'
  const donateHeroSubtitle = sv.donate_hero_subtitle || 'Every shilling you give is invested directly into programs that change lives. 100% transparent. 100% impactful.'

  let impactAmounts = defaultImpactAmounts
  if (sv.donate_impact_amounts) {
    try { impactAmounts = JSON.parse(sv.donate_impact_amounts) } catch { /* use default */ }
  }

  const activeCampaigns = campaigns ?? []

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-sky-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary-300 rounded-full blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              Give Back
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white"
              dangerouslySetInnerHTML={{ __html: donateHeroTitle.replace('<span>', '<span class="text-sky-400">') }}
            />
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              {donateHeroSubtitle}
            </p>
          </div>
        </section>

        {/* Trust badges */}
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Shield, label: 'Secure Payments', desc: 'SSL encrypted' },
              { icon: Users2, label: 'Verified NGO', desc: 'Registered in Kenya' },
              { icon: Zap, label: 'Instant Impact', desc: 'Funds deployed fast' },
              { icon: Heart, label: 'Tax Deductible', desc: 'Official receipts issued' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-primary-600" />
                <div className="text-sm font-semibold text-slate-800">{label}</div>
                <div className="text-xs text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Active Campaigns */}
            {activeCampaigns.length > 0 && (
              <div className="mb-16">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900">Active Campaigns</h2>
                  <p className="text-slate-500 mt-2">Choose a campaign to support or make a general donation below.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCampaigns.map((campaign) => {
                    const raised = Number(campaign.raised)
                    const goal   = Number(campaign.goal)
                    const progress = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0
                    const daysLeft = campaign.deadline
                      ? Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000))
                      : null
                    return (
                      <div key={campaign.id} className="card overflow-hidden">
                        <div className="relative h-48 bg-gray-100">
                          {campaign.image_url && (
                            <Image src={campaign.image_url} alt={campaign.title} fill className="object-cover" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          {daysLeft !== null && (
                            <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-2 py-1 text-xs font-bold text-primary-700">
                              {daysLeft} days left
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-slate-900 text-lg">{campaign.title}</h3>
                          {campaign.description && (
                            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{campaign.description}</p>
                          )}
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-bold text-primary-700">KES {raised.toLocaleString()}</span>
                              <span className="text-slate-400">of KES {goal.toLocaleString()}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">{progress}% funded</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Donation Form */}
            <DonateForm
              campaigns={activeCampaigns.map((c) => ({ id: c.id, title: c.title }))}
              paymentSettings={{
                mpesaPaybill:      sv.mpesa_paybill      || '400200',
                mpesaAccount:      sv.mpesa_account      || 'DONATION',
                minDonation:       parseInt(sv.min_donation_amount) || 100,
                currency:          sv.donation_currency  || 'KES',
                thankYouMessage:   sv.donation_thank_you_message || '',
              }}
            />

            {/* Impact calculator */}
            <div className="max-w-2xl mx-auto mt-14">
              <h3 className="text-xl font-bold text-slate-900 text-center mb-6">What Your Donation Does</h3>
              <div className="space-y-3">
                {impactAmounts.map(({ amount, impact }) => (
                  <div key={amount} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="text-lg font-extrabold text-primary-600 min-w-[90px]">
                      KES {amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">{impact}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
