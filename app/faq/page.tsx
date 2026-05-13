import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createPublicClient } from '@/lib/supabase/public-client'
import { ChevronDown, HelpCircle } from 'lucide-react'
import type { Metadata } from 'next'
import FaqAccordion from '@/components/faq/FaqAccordion'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'FAQs',
  description: "Frequently asked questions about 4W'S Inua Jamii Foundation — membership, donations, programs, and more.",
}

export default async function FaqPage() {
  const supabase = createPublicClient()

  const [{ data: faqsData }, { data: settingsRows }] = await Promise.all([
    supabase
      .from('faqs')
      .select('id, question, answer, category')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['faq_hero_title', 'faq_hero_subtitle']),
  ])

  const sv = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value ?? '']))
  const heroTitle    = sv.faq_hero_title    || 'Frequently Asked Questions'
  const heroSubtitle = sv.faq_hero_subtitle || 'Find answers to common questions about our Foundation, membership, donations, and programs.'

  const faqs = faqsData ?? []

  // Group by category
  const categoryOrder = ['about', 'membership', 'donations', 'volunteering', 'privacy', 'general']
  const categoryLabels: Record<string, string> = {
    about: 'About the Foundation',
    membership: 'Membership',
    donations: 'Donations',
    volunteering: 'Volunteering',
    privacy: 'Privacy & Data',
    general: 'General',
  }

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      items: faqs.filter((f) => f.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  // Any uncategorised items
  const known = new Set(categoryOrder)
  const other = faqs.filter((f) => !known.has(f.category ?? 'general'))
  if (other.length > 0) {
    grouped.push({ category: 'other', label: 'Other', items: other })
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge bg-white/10 text-white border border-white/20 mb-4 inline-block text-xs uppercase tracking-widest">
              Help Centre
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              {heroTitle}
            </h1>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              {heroSubtitle}
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 md:py-24 bg-gray-50 min-h-[60vh]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {grouped.length === 0 ? (
              <div className="text-center py-20">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-lg font-medium">No FAQs available yet.</p>
                <p className="text-slate-400 text-sm mt-1">Check back soon or contact us directly.</p>
              </div>
            ) : (
              <FaqAccordion groups={grouped} />
            )}

            {/* Contact CTA */}
            <div className="mt-16 p-8 bg-white rounded-3xl border border-primary-100 text-center shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Still have questions?</h3>
              <p className="text-slate-500 text-sm mb-5">
                Can't find what you're looking for? Our team is ready to help.
              </p>
              <a
                href="/contact"
                className="btn-primary inline-flex"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
