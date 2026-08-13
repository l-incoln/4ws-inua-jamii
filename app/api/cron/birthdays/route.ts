import { NextResponse, type NextRequest } from 'next/server'
import { runBirthdayNotifications } from '@/lib/notifications/birthdays'

export const dynamic = 'force-dynamic'
// `dynamic` alone does not bypass the fetch Data Cache; without this a rerun
// can be served stale rows and repeat work the ledger already recorded.
export const fetchCache = 'force-no-store'
export const maxDuration = 60

/**
 * GET /api/cron/birthdays
 *
 * Daily job (see vercel.json): emails the membership desk about tomorrow's
 * birthdays and greets today's celebrants. Idempotent — safe to re-run.
 *
 * Protected by CRON_SECRET; Vercel Cron sends it as `Authorization: Bearer …`.
 * Without the variable set the route refuses to run rather than being open.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }

  const provided = request.headers.get('authorization') ?? ''
  if (provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runBirthdayNotifications()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Birthday job failed'
    console.error('[cron/birthdays]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
