import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * site_settings key that gates all online payment functionality
 * (donations and membership fee payments via M-Pesa / card).
 *
 * The site can launch with payments paused by leaving this unset or 'false',
 * then re-enabled later from Admin › Settings › Payments without a redeploy.
 */
export const PAYMENTS_ENABLED_KEY = 'payments_enabled'

/**
 * Whether online payment functionality is currently enabled.
 *
 * Defaults to **false** when the setting is absent or not explicitly 'true'.
 * This is the opposite of feature flags like `rsvp_enabled` (which default on),
 * so the site launches with payments safely paused until an admin turns them on.
 */
export async function isPaymentsEnabled(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', PAYMENTS_ENABLED_KEY)
    .maybeSingle()
  return data?.value === 'true'
}

/**
 * Standard error returned by payment server actions when payments are paused,
 * so the client surfaces a consistent "Coming Soon" message even if a stale
 * form submission reaches the action.
 */
export const PAYMENTS_DISABLED_ERROR =
  'Online payments are coming soon. Please check back shortly.'
