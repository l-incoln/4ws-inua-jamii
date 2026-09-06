import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'
import AnalyticsInjector from '@/components/layout/AnalyticsInjector'
import CookieConsentBanner from '@/components/layout/CookieConsentBanner'
import { buildRootMetadata } from '@/lib/seo'

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

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata()
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

