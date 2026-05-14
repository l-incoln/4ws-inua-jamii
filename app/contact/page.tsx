'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { submitContactMessage } from '@/app/actions/contact'
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, Clock, MessageSquare } from 'lucide-react'

const contactInfo = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'info@4wsinuajamii.org',
    href: 'mailto:info@4wsinuajamii.org',
    description: 'We respond within 24 hours',
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+254 700 000 000',
    href: 'tel:+254700000000',
    description: 'Monday – Friday, 8am – 5pm EAT',
  },
  {
    icon: MapPin,
    label: 'Visit Us',
    value: 'Nairobi, Kenya',
    href: '#',
    description: 'By appointment only',
  },
  {
    icon: Clock,
    label: 'Office Hours',
    value: 'Mon – Fri: 8am – 5pm',
    href: '#',
    description: 'Weekends by appointment',
  },
]

const subjects = [
  'General Inquiry',
  'Membership & Volunteering',
  'Donations & Partnerships',
  'Media & Press',
  'Programs & Services',
  'Events',
  'Other',
]

export default function ContactPage() {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await submitContactMessage(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

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
              Get In Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              Contact <span className="text-sky-400">Us</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              Have a question, want to partner with us, or just want to say hello?
              We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

              {/* Contact info sidebar */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Let&apos;s Talk</h2>
                  <p className="text-slate-500 mt-2 leading-relaxed">
                    We&apos;re always open to new partnerships, volunteer opportunities, and community collaborations.
                  </p>
                </div>

                <div className="space-y-4">
                  {contactInfo.map(({ icon: Icon, label, value, href, description }) => (
                    <a
                      key={label}
                      href={href}
                      className={`flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${href === '#' ? 'cursor-default' : 'hover:border-primary-200'}`}
                    >
                      <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
                        <div className="font-semibold text-slate-900">{value}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Quick links */}
                <div className="p-5 bg-primary-50 rounded-2xl border border-primary-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-bold text-slate-900">Quick Links</span>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      { label: 'Become a Member', href: '/auth/signup' },
                      { label: 'Donate to a Campaign', href: '/donate' },
                      { label: 'Volunteer with Us', href: '/auth/signup' },
                      { label: 'View Our Programs', href: '/programs' },
                    ].map(({ label, href }) => (
                      <li key={label}>
                        <Link href={href} className="text-sm text-primary-700 hover:text-primary-900 hover:underline underline-offset-2">
                          → {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contact form */}
              <div className="lg:col-span-3">
                {success ? (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Message Sent!</h3>
                    <p className="text-slate-500 mt-3 max-w-md mx-auto">
                      Thank you for reaching out. We&apos;ve received your message and will get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="btn-primary mt-6"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <div className="card p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Send Us a Message</h2>

                    {error && (
                      <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label" htmlFor="name">Full Name</label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="input"
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor="email">Email Address</label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="input"
                            placeholder="jane@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label" htmlFor="subject">Subject</label>
                        <select id="subject" name="subject" required className="input">
                          <option value="">Select a subject...</option>
                          {subjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label" htmlFor="message">Message</label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={6}
                          className="input resize-none"
                          placeholder="Tell us how we can help..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isPending}
                        className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </button>

                      <p className="text-xs text-slate-400 text-center leading-relaxed">
                        By sending this message you consent to your data being processed to handle your enquiry,
                        in accordance with our{' '}
                        <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
                        {' '}and the Kenya Data Protection Act 2019.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
