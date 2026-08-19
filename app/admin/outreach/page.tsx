import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import OutreachClient from '@/components/admin/OutreachClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Outreach Activities | Admin' }

export default async function AdminOutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: activities }, { data: programs }] = await Promise.all([
    supabase.from('outreach_activities')
      .select('*')
      .order('activity_date', { ascending: false }),
    supabase.from('programs').select('id, title').order('title'),
  ])

  return <OutreachClient activities={activities ?? []} programs={programs ?? []} />
}
