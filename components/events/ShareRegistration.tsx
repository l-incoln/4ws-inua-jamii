'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import EventQRCode from './EventQRCode'

export default function ShareRegistration({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState(url)

  // Build the full URL on the client side
  useState(() => {
    if (typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}${url}`)
    }
  })

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="pt-3 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Share Registration</span>
      </div>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <EventQRCode url={url} size={120} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-1">Share this link or QR code on posters, WhatsApp, social media:</p>
          <div className="flex items-center gap-1">
            <input
              type="text"
              readOnly
              value={fullUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 flex-1 min-w-0 font-mono"
            />
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
