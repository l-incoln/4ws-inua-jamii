import type { MetadataRoute } from 'next'
import { fetchSeoSettings } from '@/lib/seo'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await fetchSeoSettings()

  return {
    name: seo.siteName,
    short_name: '4WS Inua Jamii',
    description: seo.metaDescription,
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
