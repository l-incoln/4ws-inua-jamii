'use client'

import { DollarSign, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { updatePaymentConfirmation } from '@/app/actions/admin'

export default function PaymentConfirmationButton({ memberId, paymentConfirmed }: { memberId: string; paymentConfirmed: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => updatePaymentConfirmation(memberId, !paymentConfirmed))}
      disabled={pending}
      className={`p-1.5 rounded-lg transition-colors ${
        paymentConfirmed
          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      } disabled:opacity-50`}
      title={paymentConfirmed ? 'Mark as unpaid' : 'Confirm payment'}
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
    </button>
  )
}