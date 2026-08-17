'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, Shield, Star, Award, Info } from 'lucide-react'
import { signup } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import SiteLogoClient from '@/components/layout/SiteLogoClient'

const passwordStrength = (pwd: string) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-primary-500']

// Default tier metadata (icon, colors, description). Price is overridden
// at runtime from site_settings so admins can change fees without code edits.
const TIER_META = [
  {
    value: 'basic',
    label: 'Classic Member',
    defaultPrice: 'KES 500/yr',
    icon: Shield,
    color: 'border-cyan-300 bg-cyan-50',
    activeColor: 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300',
    description: 'Access programs, events & community feed',
  },
  {
    value: 'active',
    label: 'Premium Member',
    defaultPrice: 'KES 1,500/yr',
    icon: Star,
    color: 'border-emerald-300 bg-emerald-50',
    activeColor: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300',
    description: 'Priority registration + exclusive workshops',
  },
  {
    value: 'champion',
    label: 'Gold Member',
    defaultPrice: 'KES 5,000/yr',
    icon: Award,
    color: 'border-amber-300 bg-amber-50',
    activeColor: 'border-amber-500 bg-amber-50 ring-2 ring-amber-300',
    description: 'VIP access, recognition & advisory eligibility',
  },
]

type TierOption = {
  value: string
  label: string
  defaultPrice: string
  price: string
  icon: typeof Shield
  color: string
  activeColor: string
  description: string
}

function formatPrice(currency: string, fee: string | number, years: string | number) {
  const y = Number(years) || 1
  const period = y === 1 ? 'yr' : `${y}yrs`
  const num = typeof fee === 'number' ? fee : Number(fee)
  if (!Number.isFinite(num) || num <= 0) return null
  return `${currency} ${num.toLocaleString()}/${period}`
}

function useTierOptions() {
  const [tiers, setTiers] = useState<TierOption[]>(
    TIER_META.map((t) => ({ ...t, price: t.defaultPrice })),
  )

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'membership_currency',
        'membership_fee_basic',
        'membership_fee_active',
        'membership_fee_champion',
        'membership_duration_basic',
        'membership_duration_active',
        'membership_duration_champion',
      ])
      .then(({ data }: { data: { key: string; value: string }[] | null }) => {
        if (cancelled || !data) return
        const map: Record<string, string> = {}
        for (const row of data) map[row.key] = row.value
        const currency = map.membership_currency || 'KES'
        setTiers(
          TIER_META.map((t) => {
            const fee = map[`membership_fee_${t.value}`]
            const years = map[`membership_duration_${t.value}`]
            const dynamic = fee ? formatPrice(currency, fee, years || 1) : null
            return { ...t, price: dynamic ?? t.defaultPrice }
          }),
        )
      })
    return () => { cancelled = true }
  }, [])

  return tiers
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedTier, setSelectedTier] = useState('basic')
  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''
  const tierOptions = useTierOptions()

  const strength = passwordStrength(password)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!consentChecked) {
      setError('You must agree to the Privacy Policy to create an account.')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('tier', selectedTier)
    formData.set('consent_agreed', 'true')
    const result = await signup(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Account created! Please check your email.')
    }
  }

  async function handleGoogleSignIn() {
    if (!consentChecked) {
      setError('You must agree to the Privacy Policy before signing up.')
      return
    }
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    // Pass tier and consent through the redirect URL so the callback can
    // persist them into the user's metadata (Google OAuth doesn't return
    // arbitrary queryParams).
    const params = new URLSearchParams()
    if (next) params.set('next', next)
    params.set('tier', selectedTier)
    params.set('consent', 'true')
    const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check Your Email</h2>
          <p className="text-slate-500 mt-3 leading-relaxed">{success}</p>
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <p className="font-semibold">Next step: Pay your membership fee</p>
            <p className="mt-1 text-amber-700">After confirming your email, your membership will be reviewed once payment is received. Details will be sent to your inbox.</p>
          </div>
          <Link href="/auth/login" className="btn-primary mt-6 inline-flex">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <SiteLogoClient centered className="mb-8" />

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Join the Foundation</h1>
            <p className="text-slate-500 text-sm mt-1.5">Create your member account today</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tier Selection */}
          <div className="mb-6">
            <label className="label mb-2 flex items-center gap-1.5">
              Select Membership Tier
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {tierOptions.map(({ value, label, price, icon: Icon, color, activeColor, description }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTier === value ? activeColor : color + ' hover:opacity-90'
                  }`}
                >
                  <input
                    type="radio"
                    name="tier_display"
                    value={value}
                    checked={selectedTier === value}
                    onChange={() => setSelectedTier(value)}
                    className="sr-only"
                  />
                  <Icon className={`w-5 h-5 flex-shrink-0 ${selectedTier === value ? 'text-primary-600' : 'text-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 flex-shrink-0">{price}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Membership is activated after payment confirmation by admin.
            </p>
          </div>

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-slate-700 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div>
              <label htmlFor="full_name" className="label">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="John Doe"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+254 700 000 000"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Min. 8 characters"
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          strength >= i ? strengthColor[strength] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 font-medium ${
                    strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-500' : strength === 3 ? 'text-blue-500' : 'text-primary-600'
                  }`}>
                    {strengthLabel[strength]} password
                  </p>
                </div>
              )}
            </div>

            {/* Privacy + Terms consent */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Consent Required</p>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-primary-600 flex-shrink-0"
                />
                <span className="text-sm text-slate-700">
                  I have read and agree to the{' '}
                  <Link href="/privacy" target="_blank" className="text-primary-600 hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy#terms" target="_blank" className="text-primary-600 hover:underline font-semibold">
                    Terms & Conditions
                  </Link>
                  . I consent to the processing of my personal data in accordance with the Kenya Data Protection Act 2019.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || !consentChecked}
              className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Apply'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already a member?{' '}
            <Link href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'} className="font-semibold text-primary-600 hover:text-primary-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50" />}>
      <SignupForm />
    </Suspense>
  )
}
