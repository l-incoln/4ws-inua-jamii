/**
 * Client-side image compression using the Canvas API.
 * Resizes images to fit within maxWidth/maxHeight and compresses to the given
 * quality. Outputs WebP by default (best size/quality ratio).
 *
 * GIFs are returned unchanged to preserve animation.
 * Non-image files are returned unchanged.
 */

export interface CompressOptions {
  /** Maximum width in pixels (default 1200) */
  maxWidth?:   number
  /** Maximum height in pixels (default 1200) */
  maxHeight?:  number
  /** Compression quality 0–1 (default 0.82) */
  quality?:    number
  /** Output MIME type (default 'image/webp') */
  outputType?: 'image/webp' | 'image/jpeg'
  /** Max file size in bytes; if original is smaller, skip compression (default 200 KB) */
  skipIfSmaller?: number
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const {
    maxWidth      = 1200,
    maxHeight     = 1200,
    quality       = 0.82,
    outputType    = 'image/webp',
    skipIfSmaller = 200 * 1024,
  } = options

  // Only compress raster images; skip GIF (breaks animation), documents, etc.
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif')        return file
  if (file.size <= skipIfSmaller)       return file

  return new Promise<File>((resolve, reject) => {
    const img  = new Image()
    const blobUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(blobUrl)

      let { width, height } = img
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
      width  = Math.round(width  * ratio)
      height = Math.round(height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'))
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas compression produced no output'))

          // Use compressed only if it's actually smaller
          if (blob.size >= file.size) return resolve(file)

          const ext     = outputType === 'image/webp' ? 'webp' : 'jpg'
          const newName = file.name.replace(/\.[^.]+$/, `.${ext}`)
          resolve(new File([blob], newName, { type: outputType }))
        },
        outputType,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = blobUrl
  })
}

/** Human-readable file size string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Image variants ───────────────────────────────────────────────────────────
export interface ImageVariants {
  /** Full-size compressed image (max 1920px, WebP) */
  full:  File
  /** Thumbnail (max 300px, WebP) — for grid preview */
  thumb: File
}

/**
 * Generate full + thumbnail variants of an image.
 * GIFs and non-images are returned unchanged as both variants.
 */
export async function generateVariants(file: File): Promise<ImageVariants> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return { full: file, thumb: file }
  }
  const [full, thumb] = await Promise.all([
    compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85, skipIfSmaller: 0 }),
    compressImage(file, { maxWidth: 300,  maxHeight: 300,  quality: 0.80, skipIfSmaller: 0 }),
  ])
  return { full, thumb }
}
