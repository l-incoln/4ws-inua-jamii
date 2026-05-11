import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GalleryManager from '@/components/admin/GalleryManager'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Gallery — Admin' }

export default async function AdminGalleryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data } = await supabase
    .from('gallery_items')
    .select('id, title, description, image_url, category, event_name, taken_at, sort_order, is_active, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return <GalleryManager initialItems={data ?? []} />
}
