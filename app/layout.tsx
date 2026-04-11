import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

