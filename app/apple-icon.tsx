import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Apple Touch Icon (180×180) — used by iOS for home screen bookmarks.
 * Renders the site logo on a solid background (no transparency) so it's
 * always visible on iOS home screens. Falls back to a branded "4W" badge.
 */
export default async function AppleIcon() {
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

  // Fallback: render a branded "4W" badge at 180×180
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
          fontSize: 90,
          fontWeight: 800,
          borderRadius: 44,
          letterSpacing: -4,
        }}
      >
        4W
      </div>
    ),
    { ...size }
  )
}
