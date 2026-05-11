import { createClient } from '@supabase/supabase-js'

/** Cookie-free anon client — safe for public server components that don't need auth */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
