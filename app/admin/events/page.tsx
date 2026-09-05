import { createClient } from '@/lib/supabase/server'
import AdminEventsClient from '@/components/admin/AdminEventsClient'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const [eventsResult, partnersResult, linksResult] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, title, slug, description, location, address,
        event_date, start_time, end_time, image_url,
        category, max_attendees, status
      `)
      .order('event_date', { ascending: false }),
    // All partners (active + inactive) so admins can link any of them.
    supabase
      .from('partners')
      .select('id, name, logo_url, website_url, is_active')
      .order('name', { ascending: true }),
    // Existing event↔partner links, keyed by event id.
    supabase
      .from('event_partners')
      .select('event_id, partner_id, contribution, sort_order'),
  ])

  // Group links by event id for the client form.
  const linksByEvent: Record<string, { partner_id: string; contribution: string | null }[]> = {}
  for (const row of linksResult.data ?? []) {
    const list = linksByEvent[row.event_id] ?? []
    list.push({ partner_id: row.partner_id, contribution: row.contribution })
    linksByEvent[row.event_id] = list
  }

  return (
    <AdminEventsClient
      events={eventsResult.data ?? []}
      partners={partnersResult.data ?? []}
      eventPartnerLinks={linksByEvent}
    />
  )
}
