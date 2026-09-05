import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Event partners — optional per-event sponsors/partners.
//
// The feature is opt-in: it only renders on the public event detail page when
// `show_event_partners` is 'true' AND the event has at least one linked
// partner. Until an admin turns it on, nothing changes on the site.
//
// Mirrors the lib/email-settings.ts pattern: typed defaults + a single
// `getEventPartnerSettings()` reader that site_settings keys resolve through.
// ---------------------------------------------------------------------------

const KEYS = ['show_event_partners', 'event_partners_title'] as const

export interface EventPartnerSettings {
  /** Master switch. Default off so the section is invisible until enabled. */
  showEventPartners: boolean
  /** Heading shown above the partner logos on the event detail page. */
  eventPartnersTitle: string
}

export async function getEventPartnerSettings(
  supabase: SupabaseClient,
): Promise<EventPartnerSettings> {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', KEYS as unknown as string[])

  const values = Object.fromEntries(
    (data ?? []).map((r) => [r.key as string, (r.value as string) ?? '']),
  )

  return {
    showEventPartners: values.show_event_partners === 'true',
    eventPartnersTitle: values.event_partners_title?.trim() || 'Supported by',
  }
}

export interface EventPartner {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
  contribution: string | null
}

/**
 * Fetch the partners linked to a specific event, ordered by sort_order.
 * Only active partners are returned (inactive ones are filtered by the
 * partners RLS policy on the public client, and explicitly here for safety).
 */
export async function getEventPartners(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventPartner[]> {
  const { data, error } = await supabase
    .from('event_partners')
    .select(
      `
      contribution,
      sort_order,
      partner:partners (
        id, name, logo_url, website_url, description, is_active
      )
    `,
    )
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  return data
    .map((row) => {
      const partner = row.partner as unknown as
        | {
            id: string
            name: string
            logo_url: string | null
            website_url: string | null
            description: string | null
            is_active: boolean
          }
        | null
      if (!partner || !partner.is_active) return null
      return {
        id: partner.id,
        name: partner.name,
        logo_url: partner.logo_url,
        website_url: partner.website_url,
        description: partner.description,
        contribution: row.contribution,
      } as EventPartner
    })
    .filter((p): p is EventPartner => p !== null)
}
