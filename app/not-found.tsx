import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Page Not Found — 4W\'S Inua Jamii' }

export default function NotFound() {
  return (
    <>
      <NavbarWrapper />
      <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <p className="text-8xl font-black text-primary-600">404</p>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
            <p className="text-slate-500 mt-2 text-sm">
              The page you are looking for does not exist or may have been moved.
            </p>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go home
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              View events
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
