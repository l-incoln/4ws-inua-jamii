import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEventReminders } from '@/app/actions/events'

export const dynamic = 'force-dynamic'

/**
 * Cron endpoint: Send event reminders to confirmed RSVPs.
 * Add to vercel.json:
 *   { "path": "/api/cron/event-reminders", "schedule": "0 8 * * *" }
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendEventReminders()
    return NextResponse.json({ success: true, sent: result.sent })
  } catch (err) {
    console.error('[cron] event-reminders error:', err)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
