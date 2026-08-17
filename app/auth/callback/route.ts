import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth callback handler — exchanges the code from Google (or any provider)
 * for a session, then redirects to the original destination.
 *
 * For Google sign-ups from the signup page, the tier and consent are passed
 * as query params in the redirect URL. After the session is established, we
 * update the user's metadata so the handle_new_user trigger captures them.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const tier = searchParams.get('tier')
  const consent = searchParams.get('consent')

  // Validate `next` is a relative path to prevent open redirects
  const safePath = next.startsWith('/') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If tier/consent were passed (Google sign-up from signup page),
      // update the user's metadata so the profile trigger captures them.
      if (tier || consent === 'true') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Only set metadata that isn't already present (don't overwrite
          // existing values for returning users who sign in via Google)
          const existing = user.user_metadata ?? {}
          await supabase.auth.updateUser({
            data: {
              tier: existing.tier || tier || 'basic',
              consent_agreed: existing.consent_agreed ?? (consent === 'true' ? 'true' : undefined),
            },
          })
        }
      }
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  // Redirect to login with error flag if something went wrong
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
}
