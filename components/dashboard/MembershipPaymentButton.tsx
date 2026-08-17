'use client'

import { useState, useTransition } from 'react'
import { initiateMembershipPayment } from '@/app/actions/membership-payment'
import { Smartphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  phone?: string | null
}

export default function MembershipPaymentButton({ phone }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [phoneInput, setPhoneInput] = useState(phone || '')

  function handlePay() {
    setError(null)
    setSuccess(null)
    if (!phone) {
      setShowPhoneInput(true)
      return
    }
    startTransition(async () => {
      const result = await initiateMembershipPayment()
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess('M-Pesa prompt sent! Check your phone and enter your PIN to complete the payment.')
      }
    })
  }

  function handlePayWithPhone(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!phoneInput.trim()) {
      setError('Please enter your phone number.')
      return
    }
    startTransition(async () => {
      const result = await initiateMembershipPayment(phoneInput)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess('M-Pesa prompt sent! Check your phone and enter your PIN to complete the payment.')
        setShowPhoneInput(false)
      }
    })
  }

  if (success) {
    return (
      <div className="mt-3 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">{success}</p>
          <p className="text-xs text-emerald-700 mt-1">
            Once payment is confirmed, your membership will be activated by an admin.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {!showPhoneInput ? (
        <button
          onClick={handlePay}
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
          Pay via M-Pesa
        </button>
      ) : (
        <form onSubmit={handlePayWithPhone} className="space-y-2">
          <label className="text-xs font-medium text-slate-600">
            Enter your M-Pesa phone number
          </label>
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="07XX XXX XXX"
            className="input text-sm w-48"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Send Prompt
            </button>
            <button
              type="button"
              onClick={() => setShowPhoneInput(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
