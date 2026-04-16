import { getSupabaseServerClient } from '@/lib/supabase'

/**
 * GET /api/auth/token
 * Returns the current user's Supabase session info.
 * Used internally — e.g., by the Expo WebView bridge.
 */
export async function GET(request) {
  const supabase = getSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Return the raw session so the client can use the access token if needed
  const { data: { session } } = await supabase.auth.getSession()

  return new Response(
    JSON.stringify({
      jwt: session?.access_token ?? null,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? null,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
