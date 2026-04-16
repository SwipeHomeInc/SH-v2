/**
 * Auth is now handled by Supabase.
 *
 * - Browser auth  → src/utils/useAuth.js  (uses @supabase/ssr createBrowserClient)
 * - Server auth   → src/app/api/utils/auth.js  (getAuthUser reads request cookies)
 * - Supabase util → src/lib/supabase.js
 *
 * This file is kept only so any stale import of `@/auth` doesn't hard-crash.
 * Nothing here is wired to CA's internal @auth/create system.
 */

export const auth = async () => null
