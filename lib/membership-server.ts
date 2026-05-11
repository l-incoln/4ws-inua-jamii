/**
 * Server-only membership utilities.
 * Contains HMAC signing — NEVER import this in client components.
 */
import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  return process.env.MEMBERSHIP_HMAC_SECRET ?? 'dev-fallback-secret-change-in-production'
}

/** Signs a token and returns the hex HMAC digest */
export function signToken(token: string): string {
  return createHmac('sha256', getSecret()).update(token).digest('hex')
}

/**
 * Returns the full signed verification URL.
 * sig = HMAC-SHA256(token, MEMBERSHIP_HMAC_SECRET)
 */
export function getSignedVerifyUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const sig = signToken(token)
  return `${base}/verify/${token}?sig=${sig}`
}

/**
 * Verifies a token+sig pair. Uses timing-safe comparison to prevent
 * timing attacks. Returns false if sig is missing or wrong length.
 */
export function verifyTokenSignature(token: string, sig: string): boolean {
  if (!sig || sig.length !== 64) return false
  try {
    const expected = signToken(token)
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
