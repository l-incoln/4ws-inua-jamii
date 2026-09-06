import { createClient } from '@/lib/supabase/server'
import AdminEventsClient from '@/components/admin/AdminEventsClient'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const [eventsResult, partnersResult, linksResult, formFieldsResult] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, title, slug, description, location, address,
        event_date, start_time, end_time, image_url,
        category, max_attendees, status,
        rsvp_mode, external_rsvp_url, external_rsvp_label, rsvp_deadline, requires_login
      `)
      .order('event_date', { ascending: false }),
    // All partners (active + inactive) so admins can link any of them.
    supabase
      .from('partners')
      .select('id, name, logo_url, website_url, is_active, partner_type')
      .order('name', { ascending: true }),
    // Existing event↔partner links, keyed by event id.
    supabase
      .from('event_partners')
      .select('event_id, partner_id, contribution, sort_order'),
    // Custom registration form fields, keyed by event id.
    supabase
      .from('event_form_fields')
      .select('id, event_id, field_name, field_label, field_type, field_options, is_required, sort_order, section_title, section_sort_order')
      .order('section_sort_order', { ascending: true })
      .order('sort_order', { ascending: true }),
  ])

  // Group links by event id for the client form.
  const linksByEvent: Record<string, { partner_id: string; contribution: string | null }[]> = {}
  for (const row of linksResult.data ?? []) {
    const list = linksByEvent[row.event_id] ?? []
    list.push({ partner_id: row.partner_id, contribution: row.contribution })
    linksByEvent[row.event_id] = list
  }

  // Group form fields by event id
  const fieldsByEvent: Record<string, any[]> = {}
  for (const row of formFieldsResult.data ?? []) {
    const list = fieldsByEvent[row.event_id] ?? []
    list.push({
      id: row.id,
      field_name: row.field_name,
      field_label: row.field_label,
      field_type: row.field_type,
      field_options: row.field_options,
      is_required: row.is_required,
      sort_order: row.sort_order,
      section_title: row.section_title ?? 'Additional Information',
      section_sort_order: row.section_sort_order ?? 0,
    })
    fieldsByEvent[row.event_id] = list
  }

  return (
    <AdminEventsClient
      events={eventsResult.data ?? []}
      partners={partnersResult.data ?? []}
      eventPartnerLinks={linksByEvent}
      eventFormFields={fieldsByEvent}
    />
  )
}
