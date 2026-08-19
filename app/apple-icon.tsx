import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Apple Touch Icon (180×180) — used by iOS for home screen bookmarks.
 * Falls back to a branded "4W" badge if no logo is configured.
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
        const buffer = await res.arrayBuffer()
        return new Response(buffer, {
          headers: {
            'Content-Type': res.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=3600',
          },
        })
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
