'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

export default function EventQRCode({
  url,
  size = 120,
}: {
  url: string
  size?: number
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    // Build absolute URL for the QR code (relative URLs don't work in QR codes)
    const absoluteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${url}`
      : url
    QRCode.toDataURL(absoluteUrl, {
      width: size,
      margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null))
  }, [url, size])

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="bg-slate-100 rounded-xl animate-pulse" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code for event registration"
      width={size}
      height={size}
      className="rounded-xl"
    />
  )
}
