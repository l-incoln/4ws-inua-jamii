import type { MetadataRoute } from 'next'
import { fetchSeoSettings, DEFAULT_SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo'

// Manifest pulls from the database at request time — never prerender at build.
export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = DEFAULT_SITE_NAME
  let description = DEFAULT_DESCRIPTION

  try {
    const seo = await fetchSeoSettings()
    siteName = seo.siteName
    description = seo.metaDescription
  } catch {
    // DB unavailable (e.g. during build) — use defaults.
  }

  return {
    name: siteName,
    short_name: '4WS Inua Jamii',
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1E3A8A',
    orientation: 'portrait-primary',
    categories: ['nonprofit', 'charity', 'community', 'social-impact'],
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
