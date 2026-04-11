'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, Loader2, X } from 'lucide-react'
import { rsvpForEvent, cancelRsvp } from '@/app/actions/events'

type RsvpStatus = 'confirmed' | 'waitlisted' | 'cancelled' | null

interface RsvpButtonProps {
  eventId: string
  isLoggedIn: boolean
  initialStatus: RsvpStatus
  isFull: boolean
}

export default function RsvpButton({
  eventId,
  isLoggedIn,
  initialStatus,
  isFull,
}: RsvpButtonProps) {
  const [status, setStatus] = useState<RsvpStatus>(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <Link href={`/auth/signup?next=/events/${eventId}`} className="btn-primary w-full justify-center">
          RSVP — It&apos;s Free
        </Link>
        <Link href={`/auth/login?next=/events/${eventId}`} className="btn-secondary w-full justify-center text-sm">
          Sign In to RSVP
        </Link>
      </div>
    )
  }

  const handleRsvp = () => {
    setError(null)
    startTransition(async () => {
      const result = await rsvpForEvent(eventId)
      if (result.error) {
        setError(result.error)
      } else {
        setStatus(isFull ? 'waitlisted' : 'confirmed')
      }
    })
  }

  const handleCancel = () => {
    setError(null)
    startTransition(async () => {
      const result = await cancelRsvp(eventId)
      if (result.error) {
        setError(result.error)
      } else {
        setStatus('cancelled')
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {status === 'confirmed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            You&apos;re registered for this event!
          </div>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="btn-secondary w-full justify-center text-sm text-slate-500"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Cancel RSVP
          </button>
        </div>
      )}

      {status === 'waitlisted' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 flex-shrink-0" />
            You&apos;re on the waitlist
          </div>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="btn-secondary w-full justify-center text-sm text-slate-500"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Leave Waitlist
          </button>
        </div>
      )}

      {(status === 'cancelled' || status === null) && (
        <button
          onClick={handleRsvp}
          disabled={isPending}
          className="btn-primary w-full justify-center"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFull ? (
            'Join Waitlist'
          ) : (
            'RSVP — It\'s Free'
          )}
        </button>
      )}
    </div>
  )
}

