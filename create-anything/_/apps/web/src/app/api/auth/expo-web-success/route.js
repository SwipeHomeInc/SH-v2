import { getSupabaseServerClient } from '@/lib/supabase'

/**
 * GET /api/auth/expo-web-success
 *
 * Called by the Expo WebView after a successful sign-in.
 * Posts an AUTH_SUCCESS message to both the iframe parent (web) and the
 * React Native WebView so the native app can store the session token.
 */
export async function GET(request) {
  const supabase = getSupabaseServerClient(request)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response(
      `<html><body><script>
        try { window.parent && window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '*'); } catch (e) {}
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_ERROR', error: 'Unauthorized' })); } catch (e) {}
      </script></body></html>`,
      { status: 401, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const { data: { session } } = await supabase.auth.getSession()

  const message = {
    type: 'AUTH_SUCCESS',
    jwt: session?.access_token ?? null,
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
    },
  }

  const msgJson = JSON.stringify(message)

  return new Response(
    `<html><body><script>
      try { window.parent && window.parent.postMessage(${msgJson}, '*'); } catch (e) {}
      try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(${msgJson})); } catch (e) {}
    </script></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
