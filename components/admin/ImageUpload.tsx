'use client'

import { useState, useTransition, useRef } from 'react'
import { uploadImage } from '@/app/actions/admin'
import { compressImage } from '@/lib/compress-image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  name: string
  defaultValue?: string | null
  folder?: string
  label?: string
  onChange?: (url: string) => void
}

export default function ImageUpload({
  name,
  defaultValue,
  folder = 'general',
  label = 'Cover Image',
  onChange,
}: ImageUploadProps) {
  const [url, setUrl]               = useState(defaultValue ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState(false)
  const inputRef                    = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setError(null)
    startTransition(async () => {
      // Compress images client-side before uploading
      let toUpload = file
      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        try { toUpload = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 }) } catch { /* use original */ }
      }
      const fd = new FormData()
      fd.append('file', toUpload)
      const result = await uploadImage(fd, folder)
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setUrl(result.url)
        onChange?.(result.url)
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setUrl('')
    onChange?.('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <div className="relative w-full h-48">
            <Image
              src={url}
              alt="Uploaded image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="bg-white text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isPending ? (
            <div className="flex flex-col items-center gap-2 text-primary-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  <span className="text-primary-600">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs mt-0.5">JPEG, PNG, WebP or GIF — max 5 MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  )
}
