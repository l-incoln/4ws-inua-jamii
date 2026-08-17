import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  href?: string
  label?: string
  className?: string
}

export default function BackLink({
  href = '/dashboard',
  label = 'Back to Dashboard',
  className = '',
}: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-4 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  )
}
