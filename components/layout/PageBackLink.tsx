import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  href?: string
  label?: string
  className?: string
}

/**
 * A simple back link for public pages (server component).
 * Renders as a subtle link with a left arrow, placed at the top
 * of the content area below the hero.
 */
export default function PageBackLink({
  href = '/',
  label = 'Back to Home',
  className = '',
}: Props) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 ${className}`}>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {label}
      </Link>
    </div>
  )
}
