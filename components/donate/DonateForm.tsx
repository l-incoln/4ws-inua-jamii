'use client'

import { useState, useTransition } from 'react'
import { Heart, Smartphone, CreditCard, CheckCircle2, Loader2 } from 'lucide-react'
import { submitDonation } from '@/app/actions/donations'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 20000]

interface Campaign {
  id: string
  title: string
}

interface Props {
  campaigns: Campaign[]
  selectedCampaignId?: string | null
}

export default function DonateForm({ campaigns, selectedCampaignId = null }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<{ reference: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState<number | ''>('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(selectedCampaignId)

  const effectiveAmount = amount !== '' ? amount : (customAmount ? parseFloat(customAmount) : 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!effectiveAmount || effectiveAmount < 100) {
      setError('Minimum donation is KES 100.')
      return
    }

    const form = e.currentTarget
    const first_name = (form.elements.namedItem('first_name') as HTMLInputElement).value.trim()
    const last_name  = (form.elements.namedItem('last_name') as HTMLInputElement).value.trim()
    const email      = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const phone      = (form.elements.namedItem('phone') as HTMLInputElement).value.trim() || undefined
    const message    = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim() || undefined

    startTransition(async () => {
      const result = await submitDonation({
        amount: effectiveAmount,
        first_name,
        last_name,
        email,
        phone,
        message,
        is_anonymous: isAnonymous,
        payment_method: paymentMethod,
        campaign_id: campaignId,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.reference) {
        setSuccess({ reference: result.reference })
      }
    })
  }

  if (success) {
    return (
      <div className="card p-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Thank You!</h3>
        <p className="text-slate-500 mt-3">
          Your donation of <span className="font-bold text-primary-600">KES {effectiveAmount.toLocaleString()}</span> has been recorded.
          An official receipt will be sent to your email.
        </p>
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-slate-500">
          Reference: <span className="font-mono font-semibold text-slate-700">{success.reference}</span>
        </div>
        {paymentMethod === 'mpesa' && (
          <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-800">
            <p className="font-semibold">M-Pesa Payment Instructions</p>
            <p className="mt-1 text-primary-700">
              Go to M-Pesa → Pay Bill → Enter Business Number: <strong>400200</strong> → Account: <strong>{success.reference}</strong> → Amount: <strong>KES {effectiveAmount.toLocaleString()}</strong>
            </p>
          </div>
        )}
        <button onClick={() => { setSuccess(null); setAmount(''); setCustomAmount('') }} className="btn-primary mt-6">
          Make Another Donation
        </button>
      </div>
    )
  }

  return (
    <div className="card p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Make a Donation</h2>
      <p className="text-slate-500 text-center text-sm mb-8">
        100% of every donation goes directly to our programs.
      </p>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign selector */}
        {campaigns.length > 0 && (
          <div>
            <label className="label">Choose a Campaign (optional)</label>
            <select
              className="input"
              value={campaignId ?? ''}
              onChange={(e) => setCampaignId(e.target.value || null)}
            >
              <option value="">General Fund — let us direct where needed</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Amount selection */}
        <div>
          <label className="label">Select an Amount (KES)</label>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => { setAmount(amt); setCustomAmount('') }}
                className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  amount === amt
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">KES</span>
            <input
              type="number"
              min="100"
              placeholder="Custom amount"
              className="input pl-14"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount('') }}
            />
          </div>
        </div>

        {/* Donor info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="first_name">First Name</label>
              <input id="first_name" name="first_name" type="text" required={!isAnonymous} className="input" placeholder="Jane" />
            </div>
            <div>
              <label className="label" htmlFor="last_name">Last Name</label>
              <input id="last_name" name="last_name" type="text" required={!isAnonymous} className="input" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" required className="input" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (for M-Pesa)</label>
            <input id="phone" name="phone" type="tel" className="input" placeholder="+254 700 000 000" />
          </div>
          <div>
            <label className="label" htmlFor="message">Message (Optional)</label>
            <textarea id="message" name="message" rows={3} className="input resize-none" placeholder="A word of encouragement..." />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-primary-600"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <span className="text-sm text-slate-600">Make this donation anonymous</span>
          </label>
        </div>

        {/* Payment method */}
        <div>
          <label className="label">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('mpesa')}
              className={`flex items-center gap-2.5 border-2 rounded-xl p-3 text-sm font-semibold transition-all ${
                paymentMethod === 'mpesa'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-slate-600 hover:border-primary-300'
              }`}
            >
              <Smartphone className="w-4 h-4" /> M-Pesa
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center gap-2.5 border-2 rounded-xl p-3 text-sm font-semibold transition-all ${
                paymentMethod === 'card'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-slate-600 hover:border-primary-300'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || (!amount && !customAmount)}
          className="btn-primary w-full justify-center text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <><Heart className="w-5 h-5" /> Donate{effectiveAmount > 0 ? ` KES ${effectiveAmount.toLocaleString()}` : ''}</>
          )}
        </button>
        <p className="text-xs text-center text-slate-400">
          Secure & transparent. Official receipt sent to your email.
        </p>
      </form>
    </div>
  )
}
