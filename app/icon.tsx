import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Dynamic favicon — renders the site logo from the CMS on a solid
 * background so it's always visible in browser tabs (no transparency).
 * Falls back to a branded "4W" badge if no logo is configured.
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
      // Verify the logo is reachable before embedding it
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
                background: '#1E3A8A',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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

  // Fallback: render a branded "4W" badge with solid background
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
