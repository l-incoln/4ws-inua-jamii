'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  /** Sub-label shown below the site name (e.g. "Foundation", "Admin Panel", "Member Portal") */
  subLabel?: string
  /** When true name is centered (used on auth pages) */
  centered?: boolean
  /** Tailwind color class for the site name text. Defaults to text-slate-900 */
  nameColor?: string
  /** Tailwind color class for the sub-label text. Defaults to text-primary-600 */
  subColor?: string
  /** Extra classes for the wrapping <Link> */
  className?: string
  /** Href for the logo link */
  href?: string
  /** Apply brightness(0) invert(1) filter to logo image — use on dark backgrounds */
  invert?: boolean
}

export default function SiteLogoClient({
  subLabel = 'Foundation',
  centered = false,
  nameColor = 'text-slate-900',
  subColor = 'text-primary-600',
  className = '',
  href = '/',
  invert = false,
}: Props) {
  const [logoUrl,  setLogoUrl]  = useState('')
  const [siteName, setSiteName] = useState('')
  const [logoSize, setLogoSize] = useState(40)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['logo_url', 'site_name', 'logo_size'])
      .then(({ data }) => {
        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']))
        if (map.logo_url)  setLogoUrl(map.logo_url)
        if (map.site_name) setSiteName(map.site_name)
        if (map.logo_size) setLogoSize(parseInt(map.logo_size) || 40)
      })
  }, [])

  const displayName = siteName || "4W\u2019S Inua Jamii"
  // Suppress subLabel when the site name already contains it (avoids "Foundation Foundation")
  const effectiveSubLabel =
    subLabel && displayName.toLowerCase().includes(subLabel.toLowerCase())
      ? ''
      : subLabel

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 ${centered ? 'justify-center' : ''} ${className}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={displayName}
          width={logoSize}
          height={logoSize}
          className={`rounded-xl object-contain transition-[filter] duration-200${invert ? ' brightness-0 invert' : ''}`}
          style={{ width: logoSize, height: logoSize }}
          unoptimized
        />
      ) : (
        <div
          className="rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
          style={{
            width:      logoSize,
            height:     logoSize,
            background: 'linear-gradient(135deg, #2D5CC8 0%, #1E3A8A 100%)',
          }}
        >
          <Leaf className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={centered ? 'text-center' : ''}>
        <div className={`font-bold text-lg leading-none ${nameColor}`}>{displayName}</div>
        {effectiveSubLabel && (
          <div className={`text-xs leading-none mt-0.5 ${subColor}`}>{effectiveSubLabel}</div>
        )}
      </div>
    </Link>
  )
}
