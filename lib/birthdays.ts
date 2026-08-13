// ============================================================
// Member Birthday System — shared date utilities
//
// All birthday logic is evaluated in the foundation's local time zone so a
// member in Nairobi is celebrated on their calendar day, regardless of when
// the (UTC) cron happens to run.
// ============================================================

export const BIRTHDAY_TIME_ZONE = 'Africa/Nairobi'

/** Fallback recipient for the "birthday tomorrow" reminder. */
export const BIRTHDAY_TEAM_EMAIL = 'membership@4wsinuajamii.org'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Today's calendar date in the foundation time zone, as YYYY-MM-DD. */
export function todayInZone(now: Date = new Date(), timeZone: string = BIRTHDAY_TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

/** Shifts a YYYY-MM-DD date by whole days without touching the time zone. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return shifted.toISOString().slice(0, 10)
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Whether `birthDate` is celebrated on the calendar day `isoDate`.
 * 29 February birthdays fall back to 28 February in non-leap years.
 */
export function isBirthdayOn(birthDate: string, isoDate: string): boolean {
  if (!DATE_ONLY.test(birthDate) || !DATE_ONLY.test(isoDate)) return false

  const [, bMonth, bDay] = birthDate.split('-').map(Number)
  const [year, month, day] = isoDate.split('-').map(Number)

  if (bMonth === month && bDay === day) return true
  return bMonth === 2 && bDay === 29 && month === 2 && day === 28 && !isLeapYear(year)
}

/** Day + month only — never leaks the birth year (and therefore the age). */
export function formatBirthdayDayMonth(birthDate: string): string {
  const [, month, day] = birthDate.split('-').map(Number)
  return new Date(Date.UTC(2001, month - 1, day)).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  })
}

/** Same as above, from the pre-split day/month exposed by `public_birthdays`. */
export function formatDayMonth(month: number, day: number): string {
  return new Date(Date.UTC(2001, month - 1, day)).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  })
}

/** Rejects impossible or clearly mistyped dates before they reach the DB. */
export function isPlausibleBirthDate(birthDate: string, today: string = todayInZone()): boolean {
  if (!DATE_ONLY.test(birthDate)) return false

  const [y, m, d] = birthDate.split('-').map(Number)
  const parsed = new Date(Date.UTC(y, m - 1, d))
  const roundTrips =
    parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d

  return roundTrips && y >= 1900 && birthDate < today
}
