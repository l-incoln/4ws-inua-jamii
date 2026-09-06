import NewsletterForm from '@/components/layout/NewsletterForm'
import { Mail, Bell } from 'lucide-react'

export default function NewsletterSignup() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #4FA3D1 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] opacity-15" style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2.5 glass border border-white/20 rounded-full px-5 py-2.5 text-sm text-white/90 mb-6">
          <Bell className="w-4 h-4 text-amber-400" />
          Stay in the Loop
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Get Impact Updates
        </h2>
        <p className="text-primary-100/80 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Join our newsletter for event announcements, impact reports, and stories from the field.
          No spam — just meaningful updates.
        </p>

        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2 border border-white/15">
              <NewsletterForm />
            </div>
          </div>
          <p className="text-xs text-primary-200/60 flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
