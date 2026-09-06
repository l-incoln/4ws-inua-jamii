import QRCode from 'qrcode'
import Image from 'next/image'

export default async function EventQRCode({
  url,
  size = 200,
}: {
  url: string
  size?: number
}) {
  let dataUrl = ''
  try {
    dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch {
    return null
  }

  return (
    <Image
      src={dataUrl}
      alt="QR code for event registration"
      width={size}
      height={size}
      className="rounded-xl"
      unoptimized
    />
  )
}
