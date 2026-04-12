import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DonateForm from '@/components/donate/DonateForm'
import { createClient } from '@/lib/supabase/server'
import { Heart, Shield, Zap, Users2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support 4W\'S Inua Jamii Foundation and help transform communities across Kenya.',
}

const impactAmounts = [
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Your Donation <span className="text-sky-400">Changes Lives</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              Every shilling you give is invested directly into programs that change lives.
              100% transparent. 100% impactful.
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
            <DonateForm campaigns={activeCampaigns.map((c) => ({ id: c.id, title: c.title }))} />

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
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Active Campaigns</h2>
              <p className="text-slate-500 mt-2">Choose a campaign to support or make a general donation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {campaigns.map((campaign) => {
                const progress = Math.round((campaign.raised / campaign.goal) * 100)
                return (
                  <div key={campaign.id} className="card">
                    <div className="relative h-48">
                      <Image src={campaign.image} alt={campaign.title} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-3 left-3 badge-green">{campaign.category}</span>
                      <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-2 py-1 text-xs font-bold text-primary-700">
                        {campaign.daysLeft} days left
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 text-lg">{campaign.title}</h3>
                      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{campaign.description}</p>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-primary-700">
                            KES {campaign.raised.toLocaleString()}
                          </span>
                          <span className="text-slate-400">
                            of KES {campaign.goal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                          <span>{progress}% funded</span>
                          <span>{campaign.donors} donors</span>
                        </div>
                      </div>

                      <button className="mt-4 btn-primary w-full justify-center text-sm">
                        Donate to This Campaign
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* General Donation Form */}
            <div className="max-w-2xl mx-auto">
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Make a General Donation</h2>
                <p className="text-slate-500 text-center text-sm mb-8">
                  Support our general operations and let us direct funds where they&apos;re needed most.
                </p>

                {/* Amount selection */}
                <div className="mb-6">
                  <label className="label">Select an Amount</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[500, 1000, 2500, 5000, 10000, 20000].map((amt) => (
                      <button
                        key={amt}
                        className="py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-slate-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-all"
                      >
                        KES {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">KES</span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      className="input pl-14"
                    />
                  </div>
                </div>

                {/* Donor info */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name</label>
                      <input type="text" placeholder="John" className="input" />
                    </div>
                    <div>
                      <label className="label">Last Name</label>
                      <input type="text" placeholder="Doe" className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input type="email" placeholder="john@example.com" className="input" />
                  </div>
                  <div>
                    <label className="label">Phone (for M-Pesa)</label>
                    <input type="tel" placeholder="+254 700 000 000" className="input" />
                  </div>
                  <div>
                    <label className="label">Message (Optional)</label>
                    <textarea placeholder="Your encouraging message..." className="input resize-none h-20" />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" />
                    <span className="text-sm text-slate-600">Make this donation anonymous</span>
                  </label>
                </div>

                {/* Payment methods */}
                <div className="mb-6">
                  <label className="label">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center gap-2.5 border-2 border-primary-500 bg-primary-50 rounded-xl p-3 text-sm font-semibold text-primary-700">
                      <Smartphone className="w-4 h-4" /> M-Pesa
                    </button>
                    <button className="flex items-center gap-2.5 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium text-slate-600 hover:border-primary-300 transition-colors">
                      <CreditCard className="w-4 h-4" /> Card
                    </button>
                  </div>
                </div>

                <button className="btn-gold w-full justify-center text-base py-4">
                  <Heart className="w-5 h-5" />
                  Donate Now
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">
                  Secure payment. Official receipt sent to your email.
                </p>
              </div>
            </div>

            {/* Impact calculator */}
            <div className="max-w-2xl mx-auto mt-10">
              <h3 className="text-xl font-bold text-slate-900 text-center mb-6">What Your Donation Does</h3>
              <div className="space-y-3">
                {impactAmounts.map(({ amount, impact }) => (
                  <div key={amount} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="text-lg font-extrabold text-primary-600 min-w-[70px]">
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

