'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { FileText, Check, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { applyToProgram } from '@/app/actions/programs'
import type { ApplicationStatus } from '@/types'

interface Props {
  programId: string
  programTitle: string
  isLoggedIn: boolean
  existingStatus: string | null
}

const STATUS_INFO: Record<ApplicationStatus, { label: string; cls: string; msg: string }> = {
  pending:  { label: 'Application Pending',  cls: 'bg-amber-50 border-amber-100 text-amber-800',  msg: 'Your application is being reviewed. We\'ll notify you once a decision is made.' },
  accepted: { label: 'Application Accepted!', cls: 'bg-green-50 border-green-100 text-green-800',  msg: 'Congratulations! Your application has been accepted. Check your dashboard for next steps.' },
  rejected: { label: 'Application Unsuccessful', cls: 'bg-red-50 border-red-100 text-red-800', msg: 'We reviewed your application but are unable to accept it at this time. You may apply again in the future.' },
}

export default function ProgramApplySection({ programId, programTitle, isLoggedIn, existingStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [motivation, setMotivation] = useState('')
  const [availability, setAvailability] = useState('')

  const status = existingStatus as ApplicationStatus | null
  const statusInfo = status ? STATUS_INFO[status] : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await applyToProgram(programId, motivation, availability)
      if (result?.error) { setError(result.error); return }
      setSubmitted(true)
      setIsOpen(false)
    })
  }

  // Already applied
  if (status && statusInfo) {
    return (
      <div className={`rounded-2xl border p-6 ${statusInfo.cls}`}>
        <div className="flex items-center gap-3 mb-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <h3 className="font-bold text-lg">{statusInfo.label}</h3>
        </div>
        <p className="text-sm opacity-80">{statusInfo.msg}</p>
      </div>
    )
  }

  // Just submitted
  if (submitted) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-green-800">
        <div className="flex items-center gap-3 mb-2">
          <Check className="w-5 h-5" />
          <h3 className="font-bold text-lg">Application Submitted!</h3>
        </div>
        <p className="text-sm opacity-80">We&apos;ve received your application to <strong>{programTitle}</strong>. You&apos;ll hear back from us soon.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-100 rounded-xl">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Apply to Join This Program</h3>
            <p className="text-sm text-slate-500 mt-0.5">Submit an application to participate in {programTitle}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-100">
          {!isLoggedIn ? (
            <div className="pt-5 text-center">
              <p className="text-slate-600 mb-4 text-sm">You need to be signed in to apply to this program.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/login" className="btn-primary text-sm">Sign In</Link>
                <Link href="/auth/signup" className="btn-secondary text-sm">Create Account</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <div>
                <label className="label text-xs">Why do you want to join this program? *</label>
                <textarea
                  className="input resize-none"
                  rows={5}
                  placeholder="Tell us about yourself, your motivation, and how you can contribute to this program…"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  required
                  minLength={20}
                />
                <p className="text-xs text-slate-400 mt-1">Minimum 20 characters. Be specific — strong applications are more likely to be accepted.</p>
              </div>
              <div>
                <label className="label text-xs">Your availability</label>
                <input
                  className="input"
                  placeholder="e.g. Weekends, after 5pm weekdays, full-time…"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
              </div>
              <button type="submit" disabled={isPending} className="btn-primary text-sm flex items-center gap-2">
                <Send className="w-4 h-4" />
                {isPending ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
