import { supabase } from './supabase'

/**
 * Enhanced fetch that automatically includes the Supabase Authorization header
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession()

    console.log('[authFetch] Session check:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        tokenStart: session?.access_token?.substring(0, 20),
        expiresAt: session?.expires_at
    })

    const headers = new Headers(options.headers || {})

    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
        console.log('[authFetch] Added Authorization header')
    } else {
        console.warn('[authFetch] No session or access token available!')
    }

    const finalUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
    console.log(`[authFetch] Making request to: ${finalUrl}`)

    return fetch(url, {
        ...options,
        headers,
    })
}
