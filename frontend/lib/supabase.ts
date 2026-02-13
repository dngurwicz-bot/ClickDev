import { createClient } from '@supabase/supabase-js'

import { env } from './env'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (_client) return _client
  const url = env('NEXT_PUBLIC_SUPABASE_URL')
  const key = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) {
    throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
  }
  _client = createClient(url, key)
  return _client
}
