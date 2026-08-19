import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import DistributionsClient from '@/components/admin/DistributionsClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Distributions | Admin' }

export default async function AdminDistributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: records }, { data: programs }] = await Promise.all([
    supabase.from('distribution_records')
      .select('*')
      .order('distribution_date', { ascending: false }),
    supabase.from('programs').select('id, title').order('title'),
  ])

  return <DistributionsClient records={records ?? []} programs={programs ?? []} />
}
