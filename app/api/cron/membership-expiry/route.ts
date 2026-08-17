import { NextResponse, type NextRequest } from 'next/server'
import { sendExpiryReminders } from '@/app/actions/notifications'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const maxDuration = 60

/**
 * GET /api/cron/membership-expiry
 *
 * Daily job (see vercel.json): scans for membership terms expiring in the
 * next 7 days and inserts an in-app notification for each affected member.
 * Idempotent — uses upsert so re-runs don't create duplicates.
 *
 * Protected by CRON_SECRET; Vercel Cron sends it as `Authorization: Bearer …`.
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
    const result = await sendExpiryReminders()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Expiry job failed'
    console.error('[cron/membership-expiry]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
