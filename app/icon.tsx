import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Dynamic favicon — fetches and serves the site logo from the CMS
 * with a white background for better visibility in browser tabs.
 * Falls back to local PNG file with white background, then to branded "4W" badge.
 */
export default async function Icon() {
  let logoUrl: string | null = null

  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'logo_url')
      .single()
    logoUrl = data?.value ?? null
  } catch {
    // ignore — use fallback
  }

  if (logoUrl) {
    try {
      // Fetch the actual image and render it on white background for favicon
      const res = await fetch(logoUrl, { cache: 'no-store' })
      if (res.ok) {
        return new ImageResponse(
          (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFFFFF',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="logo"
                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              />
            </div>
          ),
          { ...size }
        )
      }
    } catch {
      // fall through to fallback
    }
  }

  // Fallback 1: Use local PNG file with white background
  try {
    const localLogoUrl = '/logos/inua-jamii-logo.png'
    const res = await fetch(localLogoUrl, { cache: 'no-store' })
    if (res.ok) {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFFFFF',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={localLogoUrl}
              alt="logo"
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
            />
          </div>
        ),
        { ...size }
      )
    }
  } catch {
    // fall through to final fallback
  }

  // Fallback 2: render a branded "4W" badge with solid background
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2D5CC8 100%)',
          color: 'white',
          fontSize: 16,
          fontWeight: 800,
          borderRadius: 8,
          letterSpacing: -1,
        }}
      >
        4W
      </div>
    ),
    { ...size }
  )
}
