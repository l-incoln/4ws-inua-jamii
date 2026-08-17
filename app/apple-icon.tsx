import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public-client'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Apple touch icon — serves the site logo at 180x180 for iOS home screen.
 * Falls back to a branded "4W" badge.
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
    // ignore
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
      // fall through
    }
  }

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
          color: 'white',
          fontSize: 80,
          fontWeight: 700,
        }}
      >
        4W
      </div>
    ),
    { ...size }
  )
}
