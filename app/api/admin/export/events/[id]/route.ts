import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIER_LABELS } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch event info
  const { data: event } = await supabase
    .from('events')
    .select('title, event_date')
    .eq('id', params.id)
    .single()

  // Fetch RSVPs with member info
  const { data: rsvps, error } = await supabase
    .from('rsvps')
    .select('status, created_at, profiles(full_name, email, phone, tier, membership_status)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['Name', 'Email', 'Phone', 'Membership Tier', 'Membership Status', 'RSVP Status', 'Registered At']
  const rows = (rsvps ?? []).map((r) => {
    const p = r.profiles as { full_name?: string; email?: string; phone?: string; tier?: string; membership_status?: string } | null
    return [
      p?.full_name ?? '',
      p?.email ?? '',
      p?.phone ?? '',
      TIER_LABELS[p?.tier as keyof typeof TIER_LABELS] ?? (p?.tier ?? ''),
      p?.membership_status ?? '',
      r.status,
      new Date(r.created_at).toLocaleDateString('en-KE'),
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const eventTitle = event?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() ?? 'event'
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendees-${eventTitle}-${date}.csv"`,
    },
  })
}
