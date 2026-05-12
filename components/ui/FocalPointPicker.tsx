'use client'

import { useRef, useState, useCallback } from 'react'
import { Crosshair } from 'lucide-react'

interface Props {
  imageUrl: string
  focalX?: number   // 0–100
  focalY?: number   // 0–100
  onChange: (x: number, y: number) => void
  className?: string
}

/**
 * Click on the image to set the focal point (the part that must stay visible
 * when the image is cropped). Values are percentages (0–100).
 */
export default function FocalPointPicker({ imageUrl, focalX = 50, focalY = 50, onChange, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: focalX, y: focalY })

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    const clamped = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
    setPos(clamped)
    onChange(clamped.x, clamped.y)
  }, [onChange])

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Crosshair className="w-3.5 h-3.5" />
        Click to set focal point — this area stays visible when cropped
      </p>
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative cursor-crosshair rounded-xl overflow-hidden border border-slate-200 select-none"
        style={{ aspectRatio: '16/9' }}
        title="Click to set focal point"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Focal point preview"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Crosshair marker */}
        <div
          className="absolute pointer-events-none"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {/* outer ring */}
          <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          {/* crosshair lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60 -translate-x-1/2 -my-3" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60 -translate-y-1/2 -mx-3" />
        </div>
      </div>
      <p className="text-xs text-slate-400 font-mono">
        focal: {pos.x}% {pos.y}%
      </p>
    </div>
  )
}
