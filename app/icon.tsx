import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }

/**
 * Dynamic favicon — fetches and serves the site logo from the CMS
 * preserving its original appearance (including transparency).
 * Falls back to local PNG file with transparency, then to branded "4W" badge.
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
      // Fetch the actual image and serve it directly
      const res = await fetch(logoUrl, { cache: 'no-store' })
      if (res.ok) {
        const imageBuffer = await res.arrayBuffer()
        const contentType = res.headers.get('content-type') || 'image/png'
        
        return new Response(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch {
      // fall through to fallback
    }
  }

  // Fallback 1: Use local PNG file with transparency
  try {
    const localLogoUrl = '/logos/inua-jamii-logo.png'
    const res = await fetch(localLogoUrl, { cache: 'no-store' })
    if (res.ok) {
      const imageBuffer = await res.arrayBuffer()
      
      return new Response(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
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
