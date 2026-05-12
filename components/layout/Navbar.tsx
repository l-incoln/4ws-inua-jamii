'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, Leaf } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const navLinks = [
  { label: 'About', href: '/about' },
  {
    label: 'Programs',
    href: '/programs',
    children: [
      { label: 'Community Health', href: '/programs/community-health' },
      { label: 'Education', href: '/programs/education' },
      { label: 'Economic Empowerment', href: '/programs/economic-empowerment' },
      { label: 'Environment', href: '/programs/environment' },
    ],
  },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'Donate', href: '/donate' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [siteName, setSiteName] = useState<string>('')
  const [logoSize, setLogoSize] = useState(36)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      const el = document.documentElement
      const pct = (window.scrollY / (el.scrollHeight - el.clientHeight)) * 100
      setScrollPct(Math.min(100, Math.max(0, pct)))
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Fetch site identity from settings
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['logo_url', 'site_name', 'logo_size'])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']))
        if (map.logo_url) setLogoUrl(map.logo_url)
        if (map.site_name) setSiteName(map.site_name)
        if (map.logo_size) setLogoSize(parseInt(map.logo_size) || 36)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isHomePage = pathname === '/'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHomePage
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      {/* Scroll progress bar */}
      {scrolled && (
        <div
          className="scroll-progress-bar"
          style={{ width: `${scrollPct}%` }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName || "Site Logo"}
                width={logoSize}
                height={logoSize}
                className="rounded-xl object-contain group-hover:scale-110 transition-transform"
                style={{ width: logoSize, height: logoSize }}
                unoptimized
              />
            ) : (
              <div
                className="rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                style={{ width: logoSize, height: logoSize, background: 'linear-gradient(135deg, #2D5CC8 0%, #1E3A8A 100%)' }}
              >
                <Leaf className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="hidden sm:block">
              <span className={`font-extrabold text-lg leading-none tracking-tight ${
                scrolled || !isHomePage ? 'text-slate-900' : 'text-white'
              }`}>
                {siteName || "4W\u2019S Inua Jamii"}
              </span>
              {!(siteName || '').toLowerCase().includes('foundation') && (
                <p className={`text-[11px] font-semibold leading-none mt-0.5 uppercase tracking-widest ${
                  scrolled || !isHomePage ? 'text-primary-500' : 'text-primary-200'
                }`}>Foundation</p>
              )}
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scrolled || !isHomePage
                        ? 'text-slate-700 hover:text-primary-600 hover:bg-primary-50'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : link.label === 'Donate' ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="btn-gold !px-5 !py-2 !text-sm ml-1"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? scrolled || !isHomePage ? 'text-primary-600' : 'text-white'
                      : scrolled || !isHomePage
                      ? 'text-slate-700 hover:text-primary-600 hover:bg-primary-50'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                  {pathname === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
                      style={{ background: scrolled || !isHomePage ? '#1E3A8A' : '#38BDF8' }}
                    />
                  )}
                </Link>
              )
            )}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scrolled || !isHomePage
                      ? 'text-slate-700 hover:text-primary-600'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scrolled || !isHomePage
                      ? 'text-slate-700 hover:text-primary-600'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary px-5 py-2.5 text-sm">
                  Join Us
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled || !isHomePage ? 'text-slate-700' : 'text-white'
            }`}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) =>
                link.label === 'Donate' ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block btn-gold text-center mt-1"
                  >
                    {link.label}
                  </Link>
                ) : link.children ? (
                  <div key={link.label}>
                    <Link
                      href={link.href ?? '#'}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        pathname === link.href ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-primary-100 pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.href ?? link.label}
                    href={link.href ?? '#'}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="btn-secondary text-center"
                    >
                      Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="btn-primary">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setIsOpen(false)} className="btn-secondary text-center">
                      Sign In
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="btn-primary text-center">
                      Join Us
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

