/**
 * Supabase client utilities
 *
 * Browser: createBrowserClient (from @supabase/ssr) — stores session in cookies
 *          so the Hono server can read it on every request.
 *
 * Server:  createServerClient (from @supabase/ssr) — reads session from the
 *          incoming Request's cookie header.
 *
 * Admin:   plain createClient with service-role key — bypasses RLS.
 *          NEVER expose this to the browser.
 *
 * Env vars
 *   Client-side (must be prefixed with VITE_):
 *     VITE_SUPABASE_URL
 *     VITE_SUPABASE_ANON_KEY
 *
 *   Server-side only:
 *     SUPABASE_URL
 *     SUPABASE_ANON_KEY
 *     SUPABASE_SERVICE_ROLE_KEY
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Browser client
// createBrowserClient manages cookie storage so the server can verify sessions.
// Call this anywhere in client components — it handles its own singleton cache.
// ---------------------------------------------------------------------------
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}

// ---------------------------------------------------------------------------
// Server client (anon key — respects RLS)
// Pass the Hono/React-Router Request object so it can read the auth cookie.
// ---------------------------------------------------------------------------
export function getSupabaseServerClient(request) {
  const cookieHeader = request?.headers?.get?.('cookie') ?? ''
  const cookies = parseCookies(cookieHeader)

  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        // We don't need to set cookies from the server on each response here;
        // session refresh is handled client-side by the browser client.
        setAll: () => {},
      },
    }
  )
}

// ---------------------------------------------------------------------------
// Admin client (service-role key — bypasses RLS)
// Use for privileged operations: account deletion, seeding, etc.
// ---------------------------------------------------------------------------
export function getSupabaseAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function parseCookies(cookieStr) {
  const out = {}
  if (!cookieStr) return out
  for (const part of cookieStr.split(';')) {
    const idx = part.indexOf('=')
    if (idx < 0) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (key) out[key] = val
  }
  return out
}
