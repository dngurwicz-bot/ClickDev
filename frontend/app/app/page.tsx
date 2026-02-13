'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import type { MeResponse } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { Card } from '@/components/ui/Card'

export default function AppHome() {
  const [me, setMe] = useState<MeResponse | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      try {
        const res = await apiFetch<MeResponse>('/me', token)
        if (alive) setMe(res)
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load')
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-xl font-semibold tracking-tight">Welcome</div>
        <div className="mt-2 text-sm text-brand-text/70">
          {me ? `User: ${me.user_id}${me.is_system_admin ? ' (system admin)' : ''}` : '…'}
        </div>
      </Card>
    </div>
  )
}
