import Image from 'next/image'
import type { ImageProps } from 'next/image'

interface Props extends Omit<ImageProps, 'style'> {
  focalX?: number   // 0–100, default 50
  focalY?: number   // 0–100, default 50
  fit?: 'cover' | 'contain'
}

/**
 * Drop-in replacement for next/image that respects a focal point.
 * The focal point is applied as CSS `object-position`.
 */
export default function FocalImage({ focalX = 50, focalY = 50, fit = 'cover', className = '', ...props }: Props) {
  return (
    <Image
      {...props}
      className={className}
      style={{ objectFit: fit, objectPosition: `${focalX}% ${focalY}%` }}
    />
  )
}
