'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Loader2, MailX } from 'lucide-react'

export default function UnsubscribeForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  // If email is pre-filled from URL, auto-submit immediately
  useEffect(() => {
    if (initialEmail) {
      // Use a ref-like pattern to trigger unsubscribe on mount
      const doUnsubscribe = async () => {
        setStatus('loading')
        try {
          const res = await fetch('/api/newsletter/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: initialEmail }),
          })
          const data = await res.json()
          if (data.error) {
            setStatus('error')
            setError(data.error)
          } else {
            setStatus('success')
          }
        } catch {
          setStatus('error')
          setError('Network error. Please try again.')
        }
      }
      doUnsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUnsubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setStatus('error')
        setError(data.error)
      } else {
        setStatus('success')
      }
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">You&apos;ve Been Unsubscribed</h1>
        <p className="text-slate-500 mt-3 text-sm leading-relaxed">
          You will no longer receive newsletter emails from 4W&apos;S Inua Jamii Foundation.
          You can re-subscribe at any time from our website footer.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailX className="w-7 h-7 text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Unsubscribe</h1>
        <p className="text-slate-500 text-sm mt-2">
          Enter your email address to stop receiving our newsletter.
        </p>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleUnsubscribe} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            required
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-secondary w-full justify-center py-3 disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Unsubscribing...
            </>
          ) : (
            'Unsubscribe'
          )}
        </button>
      </form>
    </div>
  )
}
