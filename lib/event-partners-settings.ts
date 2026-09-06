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

const KEYS = [
  'show_event_partners',
  'event_partners_title',
  'show_event_partners_listing',
  'event_partners_listing_label',
] as const

export interface EventPartnerSettings {
  /** Master switch for event detail page partner strip. Default off. */
  showEventPartners: boolean
  /** Heading shown above the partner logos on the event detail page. */
  eventPartnersTitle: string
  /** Master switch for event sponsors on the /events listing page. Default on. */
  showEventPartnersListing: boolean
  /** Label shown above sponsor logos on each event card in the listing. */
  eventPartnersListingLabel: string
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
    showEventPartnersListing: values.show_event_partners_listing !== 'false',
    eventPartnersListingLabel: values.event_partners_listing_label?.trim() || 'Sponsored by',
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

/**
 * Bulk-fetch event partners for multiple events at once.
 * Returns a map of event_id -> EventPartner[].
 * Useful for the events listing page to avoid N+1 queries.
 */
export async function getEventPartnersForEvents(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Record<string, EventPartner[]>> {
  if (eventIds.length === 0) return {}

  const { data, error } = await supabase
    .from('event_partners')
    .select(
      `
      event_id,
      contribution,
      sort_order,
      partner:partners (
        id, name, logo_url, website_url, description, is_active
      )
    `,
    )
    .in('event_id', eventIds)
    .order('sort_order', { ascending: true })

  if (error || !data) return {}

  const map: Record<string, EventPartner[]> = {}
  for (const row of data) {
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
    if (!partner || !partner.is_active) continue
    const eventId = row.event_id as string
    if (!map[eventId]) map[eventId] = []
    map[eventId].push({
      id: partner.id,
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url,
      description: partner.description,
      contribution: row.contribution,
    })
  }

  return map
}
