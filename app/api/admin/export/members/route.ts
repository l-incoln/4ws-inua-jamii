import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIER_LABELS } from '@/types'

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const memberIds = searchParams.get('ids')
  const ids = memberIds ? memberIds.split(',').filter(Boolean) : null

  // Build query with optional ID filter
  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, location, tier, membership_status, role, created_at, payment_confirmed')
    .order('created_at', { ascending: false })

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  }

  const { data: members, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch auth users for email data
  let emailMap: Record<string, string> = {}
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin-client')
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    for (const u of users ?? []) emailMap[u.id] = u.email ?? ''
  } catch { /* admin client optional */ }

  // Fetch RSVP counts for exported members
  let rsvpCounts: Record<string, number> = {}
  if (members && members.length > 0) {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .in('user_id', members.map((m) => m.id))
      .eq('status', 'confirmed')

    if (rsvps) {
      for (const r of rsvps) {
        rsvpCounts[r.user_id] = (rsvpCounts[r.user_id] || 0) + 1
      }
    }
  }

  // Fetch active membership terms
  let activeTerms: Record<string, boolean> = {}
  if (members && members.length > 0) {
    const { data: terms } = await supabase
      .from('membership_terms')
      .select('user_id, is_active')
      .in('user_id', members.map((m) => m.id))

    if (terms) {
      for (const t of terms) {
        if (t.is_active) {
          activeTerms[t.user_id] = true
        }
      }
    }
  }

  // Build CSV with enhanced fields
  const headers = ['Name', 'Email', 'Phone', 'Location', 'Tier', 'Status', 'Role', 'Payment Confirmed', 'Events Attended', 'Active Membership', 'Joined']
  const rows = (members ?? []).map((m) => [
    m.full_name ?? '',
    emailMap[m.id] || '',
    m.phone ?? '',
    m.location ?? '',
    TIER_LABELS[m.tier as keyof typeof TIER_LABELS] ?? m.tier,
    m.membership_status,
    m.role,
    m.payment_confirmed ? 'Yes' : 'No',
    rsvpCounts[m.id] || 0,
    activeTerms[m.id] ? 'Yes' : 'No',
    new Date(m.created_at).toLocaleDateString('en-KE'),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="members-${date}.csv"`,
    },
  })
}
