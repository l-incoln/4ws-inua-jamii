import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Dynamic favicon — serves the site logo from the CMS as a favicon.
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
    // If we have a logo URL, fetch it and serve as-is
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

  // Fallback: render a branded "4W" badge
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)',
          color: 'white',
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        4W
      </div>
    ),
    { ...size }
  )
}
