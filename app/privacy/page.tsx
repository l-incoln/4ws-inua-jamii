import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | 4W\'S Inua Jamii Foundation',
  description: 'How we collect, use, and protect your personal information.',
}

const LAST_UPDATED = 'May 5, 2026'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white">Privacy Policy</h1>
            <p className="mt-3 text-primary-100">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="space-y-10 text-slate-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">1. Who We Are</h2>
                <p>
                  4W&apos;S Inua Jamii Foundation (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Foundation&rdquo;) is a community development
                  organisation based in Nairobi, Kenya. This Privacy Policy explains how we collect, use,
                  disclose, and safeguard information when you visit our website or use our member services.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
                <p className="mb-3">We may collect the following types of personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Account information:</strong> Full name, email address, phone number, and profile photo when you register.</li>
                  <li><strong>Membership data:</strong> Membership tier, status, and term dates.</li>
                  <li><strong>Donation records:</strong> Amount, campaign, and payment reference (we do not store full card numbers).</li>
                  <li><strong>Event participation:</strong> RSVP history and attendance records.</li>
                  <li><strong>Communication:</strong> Messages sent through our contact form or support channels.</li>
                  <li><strong>Usage data:</strong> Pages visited, features used, and general interaction patterns within the platform.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>To create and manage your member account and membership card.</li>
                  <li>To process donations and issue receipts.</li>
                  <li>To send you event notifications, announcements, and newsletters (you can unsubscribe at any time).</li>
                  <li>To improve our website, programs, and member experience.</li>
                  <li>To comply with legal obligations and resolve disputes.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">4. Membership Verification &amp; QR Codes</h2>
                <p>
                  Your digital membership card contains a QR code linked to a cryptographically signed
                  verification URL. This link allows anyone with a scanner to confirm your membership status
                  without revealing sensitive personal data. Only your name, membership tier, and validity
                  dates are displayed on the public verification page. You can request revocation of your
                  verification token at any time by contacting us.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">5. Sharing of Information</h2>
                <p className="mb-3">
                  We do not sell, trade, or rent your personal information to third parties. We may share
                  data with trusted service providers (such as Supabase for database hosting and M-Pesa
                  for payment processing) solely to operate our platform. These providers are contractually
                  obligated to keep your data confidential.
                </p>
                <p>
                  We may disclose information if required by Kenyan law or a court order.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Retention</h2>
                <p>
                  We retain your personal data for as long as your account is active or as needed to
                  provide services. If you close your account, we will delete or anonymise your data
                  within 90 days, except where we are required to retain it by law (e.g., financial
                  records for 7 years under Kenyan law).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">7. Security</h2>
                <p>
                  We implement industry-standard security measures including HTTPS encryption, row-level
                  security in our database, HMAC-signed tokens for membership verification, and access
                  controls limiting who can view your data. No method of transmission over the internet
                  is 100% secure; however, we strive to use commercially acceptable means to protect your
                  personal information.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">8. Your Rights</h2>
                <p className="mb-3">Under the Kenya Data Protection Act (2019), you have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction of inaccurate data.</li>
                  <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
                  <li>Withdraw consent for marketing communications.</li>
                  <li>Lodge a complaint with the Office of the Data Protection Commissioner (ODPC).</li>
                </ul>
                <p className="mt-3">
                  To exercise any of these rights, contact us at{' '}
                  <a href="mailto:privacy@4wsinuajamii.org" className="text-primary-600 hover:underline font-medium">
                    privacy@4wsinuajamii.org
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">9. Cookies</h2>
                <p>
                  We use essential session cookies for authentication. We do not use advertising or
                  tracking cookies. You can configure your browser to refuse cookies, but this may
                  prevent you from using authenticated features of the platform.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">10. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify registered members
                  via email of any material changes. Continued use of the platform after such notice
                  constitutes acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contact Us</h2>
                <p>
                  If you have questions or concerns about this Privacy Policy, please contact us:
                </p>
                <div className="mt-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 text-sm">
                  <p><strong>4W&apos;S Inua Jamii Foundation</strong></p>
                  <p>Nairobi, Kenya</p>
                  <p>Email: <a href="mailto:privacy@4wsinuajamii.org" className="text-primary-600 hover:underline">privacy@4wsinuajamii.org</a></p>
                  <p>Phone: <a href="tel:+254700000000" className="text-primary-600 hover:underline">+254 700 000 000</a></p>
                </div>
              </div>

            </div>

            <div className="mt-14 pt-8 border-t border-gray-100 text-center">
              <Link href="/" className="btn-secondary text-sm">← Back to Home</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
