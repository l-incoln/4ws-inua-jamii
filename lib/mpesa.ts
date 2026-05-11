/**
 * M-Pesa Daraja API — STK Push (Lipa Na M-Pesa Online)
 *
 * Required environment variables (add to .env.local):
 *   MPESA_CONSUMER_KEY      – Daraja app Consumer Key
 *   MPESA_CONSUMER_SECRET   – Daraja app Consumer Secret
 *   MPESA_SHORTCODE         – Your business shortcode (paybill/till number)
 *   MPESA_PASSKEY           – Lipa Na M-Pesa online passkey
 *   MPESA_CALLBACK_URL      – https://yourdomain.com/api/mpesa/callback
 *   MPESA_ENV               – "sandbox" | "production"  (defaults to sandbox)
 */

const BASE_URL =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

async function getAccessToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY
  const secret = process.env.MPESA_CONSUMER_SECRET

  if (!key || !secret) throw new Error('M-Pesa credentials not configured')

  const credentials = Buffer.from(`${key}:${secret}`).toString('base64')
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error('Failed to get M-Pesa access token')
  const data = await res.json()
  return data.access_token as string
}

export interface StkPushResult {
  success: boolean
  checkoutRequestId?: string
  error?: string
}

export async function initiateStkPush({
  phone,
  amount,
  reference,
  description,
}: {
  phone: string      // Format: 2547XXXXXXXX
  amount: number     // KES, integer
  reference: string  // Donation reference (max 12 chars)
  description: string
}): Promise<StkPushResult> {
  try {
    const shortcode  = process.env.MPESA_SHORTCODE
    const passkey    = process.env.MPESA_PASSKEY
    const callbackUrl = process.env.MPESA_CALLBACK_URL

    if (!shortcode || !passkey || !callbackUrl) {
      return { success: false, error: 'M-Pesa not configured on the server' }
    }

    const token     = await getAccessToken()
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    const payload = {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.round(amount),
      PartyA:            phone,
      PartyB:            shortcode,
      PhoneNumber:       phone,
      CallBackURL:       callbackUrl,
      AccountReference:  reference.slice(0, 12),
      TransactionDesc:   description.slice(0, 13),
    }

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (data.ResponseCode === '0') {
      return { success: true, checkoutRequestId: data.CheckoutRequestID }
    }
    return { success: false, error: data.errorMessage ?? data.ResultDesc ?? 'STK push failed' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}
