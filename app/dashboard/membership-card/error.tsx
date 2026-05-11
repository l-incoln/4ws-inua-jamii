'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function MembershipCardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[MembershipCard] Runtime error:', error)
  }, [error])

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Membership Card Error</h1>
      <div className="card p-6 border-red-200 bg-red-50 space-y-3">
        <p className="font-semibold text-red-700">Something went wrong loading your membership card.</p>
        <pre className="text-xs text-red-600 bg-red-100 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-words max-h-48">
          {error.message}
          {error.stack ? '\n\n' + error.stack : ''}
        </pre>
        <div className="flex gap-3 pt-1">
          <button onClick={reset} className="btn-primary text-sm">Try again</button>
          <Link href="/dashboard" className="btn-secondary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
