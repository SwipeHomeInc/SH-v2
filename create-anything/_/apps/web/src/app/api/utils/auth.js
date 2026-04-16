import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase'

/**
 * Returns the authenticated user from the incoming Request's Supabase session cookie.
 *
 * @param {Request} request  The Hono / React-Router Request object
 * @returns {{ id: number, email: string, name: string|null, auth_uid: string } | null}
 *   - id       Integer profile ID (matches legacy integer IDs in all tables)
 *   - auth_uid Supabase UUID (auth.users primary key)
 *   - null if unauthenticated or session is invalid
 */
export async function getAuthUser(request) {
  try {
    const supabase = getSupabaseServerClient(request)

    // Validate the JWT from the cookie against Supabase (authoritative check)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    // Resolve the integer profile ID (Supabase auth uses UUIDs; our tables use integers)
    const admin = getSupabaseAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, name')
      .eq('auth_uid', user.id)
      .single()

    if (profileError || !profile) {
      // Profile row missing — create it so the user can continue
      const { data: newProfile } = await admin
        .from('profiles')
        .insert({ auth_uid: user.id, email: user.email })
        .select('id, name')
        .single()

      return {
        id: newProfile?.id ?? null,
        email: user.email,
        name: user.user_metadata?.name ?? null,
        auth_uid: user.id,
      }
    }

    return {
      id: profile.id,
      email: user.email,
      name: profile.name ?? user.user_metadata?.name ?? null,
      auth_uid: user.id,
    }
  } catch (e) {
    console.error('getAuthUser error:', e)
    return null
  }
}
