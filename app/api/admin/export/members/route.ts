import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIER_LABELS } from '@/types'

export async function GET() {
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

  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, location, tier, membership_status, role, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build CSV
  const headers = ['Name', 'Email', 'Phone', 'Location', 'Tier', 'Status', 'Role', 'Joined']
  const rows = (members ?? []).map((m) => [
    m.full_name ?? '',
    m.email ?? '',
    m.phone ?? '',
    m.location ?? '',
    TIER_LABELS[m.tier as keyof typeof TIER_LABELS] ?? m.tier,
    m.membership_status,
    m.role,
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
