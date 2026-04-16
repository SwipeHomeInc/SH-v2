'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

/**
 * Returns the current authenticated Supabase user (or null if logged out).
 *
 * { user, data, loading, refetch }
 *   user / data  — the Supabase User object (id is the UUID from auth.users)
 *   loading      — true during initial session resolution
 *   refetch      — force-refresh the session
 */
const useUser = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser ?? null)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // Resolve initial session without a network round-trip
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Keep state in sync with sign-in / sign-out / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, data: user, loading, refetch }
}

export { useUser }
export default useUser
