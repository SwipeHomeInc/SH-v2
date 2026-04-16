'use client'
import { useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

/**
 * Auth actions hook backed by Supabase.
 *
 * API surface is intentionally close to the old @auth/create/react hook so
 * that signin/signup/logout pages need minimal changes.
 *
 * Phase 2 (Apple / Google OAuth): add signInWithApple / signInWithGoogle
 * using supabase.auth.signInWithOAuth({ provider: 'apple' | 'google' }).
 */
function useAuth() {
  const signInWithCredentials = useCallback(async ({ email, password, callbackUrl, redirect } = {}) => {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (redirect && callbackUrl) {
      window.location.href = callbackUrl
    }
  }, [])

  const signUpWithCredentials = useCallback(async ({ email, password, callbackUrl, redirect } = {}) => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)

    // Sign-up in Supabase can require email confirmation (configurable in dashboard).
    // If the user object is returned immediately, sign them in right away.
    if (data?.user && !data?.user?.identities?.length === 0) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw new Error(signInError.message)
    }

    if (redirect && callbackUrl) {
      window.location.href = callbackUrl
    }
  }, [])

  // Phase 2 — wire up Apple and Google once OAuth is enabled in Supabase dashboard
  const signInWithGoogle = useCallback(async ({ callbackUrl } = {}) => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl ?? window.location.origin },
    })
  }, [])

  const signInWithApple = useCallback(async ({ callbackUrl } = {}) => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: callbackUrl ?? window.location.origin },
    })
  }, [])

  const signOut = useCallback(async ({ callbackUrl, redirect } = {}) => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    if (redirect) {
      window.location.href = callbackUrl || '/account/signin'
    }
  }, [])

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithApple,
    signOut,
  }
}

export default useAuth
