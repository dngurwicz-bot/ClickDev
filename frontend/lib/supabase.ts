import { createClient } from '@supabase/supabase-js'

import { requireEnv } from './env'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (_client) return _client
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  _client = createClient(url, key)
  return _client
}
