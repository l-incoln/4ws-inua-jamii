import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'
import AnalyticsInjector from '@/components/layout/AnalyticsInjector'

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '4W\'S Inua Jamii Foundation',
    template: '%s | 4W\'S Inua Jamii Foundation',
  },
  description:
    'Empowering communities through unity, service, and sustainable impact. Join us in building a better tomorrow across Kenya.',
  keywords: ['foundation', 'community', 'Kenya', 'social impact', 'charity', 'empowerment'],
  authors: [{ name: '4W\'S Inua Jamii Foundation' }],
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
  icons: {
    icon: '/favicon.ico',
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
      </body>
    </html>
  )
}

