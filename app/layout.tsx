import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'
import AnalyticsInjector from '@/components/layout/AnalyticsInjector'
import CookieConsentBanner from '@/components/layout/CookieConsentBanner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

// Every page renders NavbarWrapper + Footer, both of which call Supabase
// (cookies() / createPublicClient) at request time. Force dynamic so Vercel
// doesn't try to statically pre-render pages and crash without a request context.
export const dynamic = 'force-dynamic'

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export const metadata: Metadata = {
  title: {
    default: '4W\'S Inua Jamii Foundation',
    template: '%s | 4W\'S Inua Jamii Foundation',
  },
  description:
    'Empowering communities through unity, service, and sustainable impact. Join us in building a better tomorrow across Kenya.',
  keywords: ['foundation', 'community', 'Kenya', 'social impact', 'charity', 'empowerment'],
  authors: [{ name: '4W\'S Inua Jamii Foundation' }],
  icons: {
    icon: [
      { url: '/icon', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://4wsinuajamii.org',
    siteName: '4W\'S Inua Jamii Foundation',
    title: '4W\'S Inua Jamii Foundation',
    description: 'Empowering communities through unity, service, and sustainable impact.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '4W\'S Inua Jamii Foundation',
    description: 'Empowering communities through unity, service, and sustainable impact.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <AnalyticsInjector />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  )
}

