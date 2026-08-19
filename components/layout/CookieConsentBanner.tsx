'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cookie, X } from 'lucide-react'

const CONSENT_KEY = '4ws-cookie-consent'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  // On dashboard/admin pages, the mobile bottom nav sits at bottom-0.
  // Lift the cookie banner above it so it doesn't block navigation.
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')

  useEffect(() => {
    // Only show on client side, after checking localStorage
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (!stored) {
        // Small delay so it doesn't flash on page load
        const timer = setTimeout(() => setVisible(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage might be blocked — don't show banner
    }
  }, [])

  function handleAccept() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted: true,
        date: new Date().toISOString(),
      }))
    } catch {}
    setVisible(false)
  }

  function handleDecline() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted: false,
        date: new Date().toISOString(),
      }))
    } catch {}
    setVisible(false)
  }

  function handleDismiss() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`fixed left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom ${
        isDashboard ? 'bottom-20 lg:bottom-0' : 'bottom-0'
      }`}
    >
      <div className="max-w-3xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-10 h-10 bg-slate-800 rounded-xl items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">We use cookies</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We use essential cookies to make our website work and analytics cookies to understand
              how you use it. By clicking &quot;Accept&quot;, you consent to the use of cookies in
              accordance with our{' '}
              <Link href="/privacy" className="text-amber-400 hover:text-amber-300 underline font-semibold">
                Privacy Policy
              </Link>
              {' '}and the Kenya Data Protection Act 2019.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={handleAccept}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors"
              >
                Accept all cookies
              </button>
              <button
                onClick={handleDecline}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Essential only
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
