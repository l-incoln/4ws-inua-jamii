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
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
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
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold">Stay Updated</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Get the latest news and updates from the foundation.
              </p>
            </div>
            <form className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
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

