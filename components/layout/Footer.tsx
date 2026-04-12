import Link from 'next/link'
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

const footerLinks = {
  Foundation: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Mission', href: '/about#mission' },
    { label: 'Leadership', href: '/about#leadership' },
    { label: 'Impact Report', href: '/about#impact' },
  ],
  Programs: [
    { label: 'Community Health', href: '/programs/community-health' },
    { label: 'Education', href: '/programs/education' },
    { label: 'Economic Empowerment', href: '/programs/economic-empowerment' },
    { label: 'Environment', href: '/programs/environment' },
  ],
  Community: [
    { label: 'Events', href: '/events' },
    { label: 'Blog & Stories', href: '/blog' },
    { label: 'Become a Member', href: '/auth/signup' },
    { label: 'Volunteer', href: '/auth/signup' },
  ],
  Support: [
    { label: 'Donate', href: '/donate' },
    { label: 'Partnerships', href: '/about#partners' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

const socialLinks = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Gradient accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1E3A8A 0%, #4FA3D1 35%, #6DBE45 65%, #F59E0B 100%)' }} />

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2D5CC8 0%, #1E3A8A 100%)' }}>
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg leading-none">
                  4W&apos;S Inua Jamii
                </span>
                <p className="text-xs text-primary-400 leading-none mt-0.5">Foundation</p>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Empowering communities through unity, sustainable development, and collective action.
              Together we build a brighter future for Kenya.
            </p>

            {/* Contact */}
            <div className="space-y-2.5">
              <a
                href="mailto:info@4wsinuajamii.org"
                className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                info@4wsinuajamii.org
              </a>
              <a
                href="tel:+254700000000"
                className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-primary-400 transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                +254 700 000 000
              </a>
              <div className="flex items-start gap-2.5 text-sm text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Nairobi, Kenya
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-slate-400 hover:text-primary-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-slate-800 bg-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-lg">Stay in the Loop</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Get the latest impact stories, events, and updates from the foundation.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 md:w-72 rounded-xl bg-slate-700/70 border border-slate-600 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} 4W&apos;S Inua Jamii Foundation. All rights reserved.</p>
          <p>Built with purpose. Powered by community.</p>
        </div>
      </div>
    </footer>
  )
}

