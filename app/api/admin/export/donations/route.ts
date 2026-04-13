import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data: donations, error } = await supabase
    .from('donations')
    .select('id, donor_name, donor_email, amount, currency, payment_method, reference, status, is_anonymous, message, created_at, donation_campaigns(title)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['Date', 'Donor Name', 'Email', 'Campaign', 'Amount (KES)', 'Method', 'Reference', 'Status', 'Message', 'Anonymous']
  const rows = (donations ?? []).map((d) => {
    const campaign = (d.donation_campaigns as { title?: string } | null)?.title ?? 'General'
    return [
      new Date(d.created_at).toLocaleDateString('en-KE'),
      d.is_anonymous ? 'Anonymous' : (d.donor_name ?? ''),
      d.is_anonymous ? '' : (d.donor_email ?? ''),
      campaign,
      Number(d.amount).toFixed(2),
      d.payment_method ?? '',
      d.reference ?? '',
      d.status,
      d.message ?? '',
      d.is_anonymous ? 'Yes' : 'No',
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="donations-${date}.csv"`,
    },
  })
}
