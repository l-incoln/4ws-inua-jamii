import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * Only use in server actions / API routes. Never expose to client.
 *
 * Reads opt out of Next.js' fetch Data Cache: privileged queries must always
 * see current rows, otherwise cached responses can make an idempotency check
 * or a permission read act on stale data.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  })
}
