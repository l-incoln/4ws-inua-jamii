'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface Props {
  href?: string
  label?: string
  className?: string
}

/**
 * A back-navigation button. If `href` is provided it navigates directly to
 * that path; otherwise it calls `router.back()`.
 */
export default function BackButton({ href, label = 'Back', className }: Props) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors font-medium ${className ?? ''}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
