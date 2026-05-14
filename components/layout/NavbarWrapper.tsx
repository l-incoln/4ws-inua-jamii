import { createClient } from '@/lib/supabase/server'
import NavbarClient from './Navbar'

/**
 * Server component wrapper — pre-fetches logo/site-name from site_settings
 * so the Navbar renders with the correct logo on first paint (no flash).
 */
export default async function Navbar() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['logo_url', 'site_name', 'logo_size'])

  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? '']))

  return (
    <NavbarClient
      initialLogoUrl={map.logo_url || ''}
      initialSiteName={map.site_name || ''}
      initialLogoSize={map.logo_size ? parseInt(map.logo_size) || 36 : 36}
    />
  )
}
