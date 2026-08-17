import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms & Conditions | 4W\'S Inua Jamii Foundation',
  description: 'The terms and conditions governing membership and use of our platform.',
}

const LAST_UPDATED = 'May 5, 2026'

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-hero-gradient py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white">Terms &amp; Conditions</h1>
            <p className="mt-3 text-primary-100">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 space-y-8">
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 text-sm leading-relaxed">
                These Terms &amp; Conditions govern your use of the 4W&apos;S Inua Jamii Foundation
                website and your membership in the Foundation. By registering as a member, donating,
                or using our platform, you agree to these terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Membership Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>Membership is open to individuals aged 18 years and above.</li>
                <li>You must provide accurate and truthful information during registration.</li>
                <li>Membership is subject to approval by the Foundation&apos;s administrative team.</li>
                <li>The Foundation reserves the right to approve or reject membership applications at its discretion.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Membership Fees &amp; Renewal</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>Membership is annual and must be renewed upon expiry to maintain active status.</li>
                <li>Membership fees vary by tier (Classic, Premium, Gold) and are set by the Foundation.</li>
                <li>Fees are non-refundable except in cases of administrative error.</li>
                <li>Payment can be made via M-Pesa, bank transfer, or other methods as designated by the Foundation.</li>
                <li>Members who do not renew within 30 days of expiry will have their membership deactivated.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Member Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>You will not use the platform for unlawful, harmful, or fraudulent activities.</li>
                <li>You will respect the privacy and dignity of other members.</li>
                <li>You will not share, duplicate, or transfer your membership card or QR code to third parties.</li>
                <li>Your membership card and QR code are for personal identification only.</li>
                <li>You will notify the Foundation of any unauthorized use of your account.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Content &amp; Conduct</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>Content you post (comments, stories, volunteer reports) must be respectful and accurate.</li>
                <li>The Foundation reserves the right to moderate, edit, or remove content that violates these terms.</li>
                <li>You retain ownership of content you submit but grant the Foundation a non-exclusive license to display it on our platforms.</li>
                <li>Prohibited content includes: hate speech, harassment, misinformation, spam, copyrighted material you do not own, and content that violates Kenyan law.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Donations</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>Donations are voluntary and non-refundable except in cases of administrative error.</li>
                <li>The Foundation will issue a receipt for every donation received.</li>
                <li>Donations are used in accordance with the Foundation&apos;s mission and programs as described on our website.</li>
                <li>Anonymous donations will not have donor information displayed publicly.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Events &amp; RSVPs</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>Members may RSVP to events subject to capacity limits.</li>
                <li>If an event is full, members may join a waitlist and will be notified if a spot becomes available.</li>
                <li>The Foundation reserves the right to cancel or reschedule events due to unforeseen circumstances.</li>
                <li>Members are expected to cancel their RSVP if they can no longer attend, to allow waitlisted members to participate.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Volunteer Tasks</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>Volunteer tasks are assigned on a first-come, first-served basis unless designated otherwise by an administrator.</li>
                <li>Volunteers are expected to complete claimed tasks by the specified deadline.</li>
                <li>Completed tasks contribute to your impact score within the Foundation.</li>
                <li>The Foundation reserves the right to reassign or cancel tasks as needed.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Email Communications</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>You consent to receiving transactional emails (receipts, status updates, event reminders).</li>
                <li>You may opt out of marketing and newsletter emails at any time using the unsubscribe link in each email.</li>
                <li>Transactional emails will continue to be sent as necessary for account operations.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>The Foundation&apos;s logo, branding, and website content are protected by intellectual property laws.</li>
                <li>You may not use the Foundation&apos;s branding without prior written consent.</li>
                <li>Members may use their membership card for personal identification purposes only.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Suspension &amp; Termination</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>The Foundation reserves the right to suspend or revoke membership for violations of these terms.</li>
                <li>Suspended members will be notified by email and may appeal the decision within 14 days.</li>
                <li>Upon termination, your membership card and QR code will be deactivated.</li>
                <li>Personal data will be retained in accordance with our{' '}
                  <Link href="/privacy" className="text-primary-600 hover:underline font-semibold">Privacy Policy</Link>.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
                <li>The Foundation is not liable for any indirect, incidental, or consequential damages arising from the use of our platform.</li>
                <li>The Foundation does not guarantee uninterrupted access to the website or its features.</li>
                <li>Members participate in events and volunteer activities at their own risk.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Changes to Terms</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Foundation may update these Terms &amp; Conditions from time to time. Members will be
                notified of significant changes by email. Continued use of the platform after changes
                constitutes acceptance of the updated terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">13. Governing Law</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                These Terms &amp; Conditions are governed by the laws of the Republic of Kenya. Any
                disputes shall be resolved in accordance with Kenyan law and the jurisdiction of Kenyan courts.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">14. Contact Us</h2>
              <p className="text-sm text-slate-600">
                If you have questions about these Terms &amp; Conditions, please contact us:
              </p>
              <div className="mt-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 text-sm">
                <p><strong>4W&apos;S Inua Jamii Foundation</strong></p>
                <p>Nairobi, Kenya</p>
                <p>Email: <a href="mailto:admin@4wsinuajamii.org" className="text-primary-600 hover:underline">admin@4wsinuajamii.org</a></p>
                <p>Privacy: <a href="mailto:privacy@4wsinuajamii.org" className="text-primary-600 hover:underline">privacy@4wsinuajamii.org</a></p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
