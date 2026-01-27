import { supabase } from './supabase'

/**
 * Enhanced fetch that automatically includes the Supabase Authorization header
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession()

    const headers = new Headers(options.headers || {})

    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
    }

    return fetch(url, {
        ...options,
        headers,
    })
}
