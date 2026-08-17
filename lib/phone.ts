/**
 * Normalise a Kenyan phone number to the 2547XXXXXXXX format required by M-Pesa.
 * Handles: 07XX, +2547XX, 2547XX, 7XX (bare).
 * Returns null if the input is empty or cannot be normalised.
 */
export function normaliseKePhone(input: string): string | null {
  const raw = input.replace(/\s+/g, '').replace(/-/g, '')
  if (!raw) return null

  let phone: string
  if (raw.startsWith('254')) {
    phone = raw
  } else if (raw.startsWith('+254')) {
    phone = raw.slice(1)
  } else if (raw.startsWith('0')) {
    phone = `254${raw.slice(1)}`
  } else if (raw.startsWith('7') || raw.startsWith('1')) {
    // Bare number without prefix — assume Kenyan mobile
    phone = `254${raw}`
  } else {
    return null
  }

  // Validate: should be 12 digits starting with 254
  if (!/^254\d{9}$/.test(phone)) return null
  return phone
}
