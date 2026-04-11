'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { resetPassword } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await resetPassword(formData)
    setLoading(false)
    if (result?.error) setError(result.error)
    else if (result?.success) setSuccess(result.message || 'Reset link sent.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-slate-900 leading-none">4W&apos;S Inua Jamii</div>
            <div className="text-xs text-primary-600 mt-0.5 leading-none">Foundation</div>
          </div>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email Sent!</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">{success}</p>
              <Link href="/auth/login" className="btn-primary mt-6 inline-flex">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                <p className="text-slate-500 text-sm mt-1.5">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

