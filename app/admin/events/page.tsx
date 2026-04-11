import { createClient } from '@/lib/supabase/server'
import AdminEventsClient from '@/components/admin/AdminEventsClient'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select(`
      id, title, slug, description, location, address,
      event_date, start_time, end_time, image_url,
      category, max_attendees, status
    `)
    .order('event_date', { ascending: false })

  return <AdminEventsClient events={events ?? []} />
}

