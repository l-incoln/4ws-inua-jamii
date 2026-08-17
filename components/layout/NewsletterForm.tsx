'use client'

import { useState, useTransition } from 'react'
import { subscribeNewsletter } from '@/app/actions/newsletter'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function NewsletterForm() {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    startTransition(async () => {
      const result = await subscribeNewsletter({ email })
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(true)
        setEmail('')
      }
    })
  }

  if (success) {
    return (
      <div className="flex items-start gap-2 w-full md:w-72">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-300">
          You&apos;re subscribed! Check your inbox for a welcome email.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        disabled={pending}
        className="flex-1 md:w-72 rounded-xl bg-slate-700/70 border border-slate-600 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
      </button>
      {error && (
        <div className="hidden">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {error && (
        <p className="absolute mt-12 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </form>
  )
}
