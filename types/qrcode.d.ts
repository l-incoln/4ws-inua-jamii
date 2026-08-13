declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    type?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    width?: number
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
  export function toString(text: string, options?: Record<string, unknown>): Promise<string>
  export function toBuffer(text: string, options?: Record<string, unknown>): Promise<Buffer>
  const QRCode: {
    toDataURL: typeof toDataURL
    toString: typeof toString
    toBuffer: typeof toBuffer
  }

  export default QRCode
}
