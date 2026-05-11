import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import CampaignsClient from '@/components/admin/CampaignsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Donation Campaigns | Admin' }

export default async function AdminCampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('donation_campaigns')
    .select('id, slug, title, description, goal, raised, image_url, is_active, deadline, created_at')
    .order('created_at', { ascending: false })

  return <CampaignsClient campaigns={campaigns ?? []} />
}
