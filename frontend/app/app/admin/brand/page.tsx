'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { MeResponse } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export default function BrandPreviewPage() {
  const [me, setMe] = useState<MeResponse | null>(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const supabase = getSupabase()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) return
        const meRes = await apiFetch<MeResponse>('/me', token)
        if (alive) setMe(meRes)
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load')
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const isAllowed = !!me?.is_system_admin

  const tokens = useMemo(() => {
    if (typeof window === 'undefined') return []
    const names = [
      '--brand-primary',
      '--brand-secondary',
      '--brand-accent',
      '--brand-bg',
      '--brand-surface',
      '--brand-text',
    ]
    return names.map((n) => ({ name: n, value: getCssVar(n) }))
  }, [me?.user_id])

  if (!isAllowed) {
    return <Card>Unauthorized.</Card>
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-xl font-semibold tracking-tight">Brand Preview</div>
        <div className="mt-1 text-sm text-brand-text/70">This page is generated from the extracted brand tokens.</div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {tokens.map((t) => (
            <div key={t.name} className="rounded-2xl border border-brand-text/10 bg-brand-surface p-4">
              <div className="text-xs font-semibold text-brand-text/70">{t.name}</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border border-brand-text/10" style={{ background: t.value }} />
                <div className="font-mono text-xs">{t.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-semibold">Buttons</div>
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-semibold">Inputs</div>
            <Input label="Example" placeholder="Type here…" />
          </div>
        </div>
      </Card>
    </div>
  )
}
