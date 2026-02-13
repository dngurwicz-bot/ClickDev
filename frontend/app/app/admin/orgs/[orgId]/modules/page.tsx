'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { MeResponse, ModuleFlag } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AdminOrgModulesPage() {
  const params = useParams<{ orgId: string }>()
  const orgId = params.orgId

  const [me, setMe] = useState<MeResponse | null>(null)
  const [mods, setMods] = useState<ModuleFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAllowed = !!me?.is_system_admin

  async function load() {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const meRes = await apiFetch<MeResponse>('/me', token)
      setMe(meRes)
      if (!meRes.is_system_admin) return
      const res = await apiFetch<ModuleFlag[]>(`/admin/orgs/${orgId}/modules`, token)
      setMods(res)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [orgId])

  function setEnabled(key: string, on: boolean) {
    setMods((prev) => prev.map((m) => (m.key === key ? { ...m, is_enabled: key === 'core' ? true : on } : m)))
  }

  async function save() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const updates = mods.map((m) => ({ module_key: m.key, is_enabled: m.is_enabled }))
      const res = await apiFetch<ModuleFlag[]>(`/admin/orgs/${orgId}/modules`, token, {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
      })
      setMods(res)
      toast.success('Saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">Modules</div>
            <div className="mt-1 text-sm text-brand-text/70">{orgId}</div>
          </div>
          <a className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-text/5" href={`/app/admin/orgs/${orgId}`}>
            Back
          </a>
        </div>
      </Card>

      {!isAllowed ? (
        <Card>Unauthorized.</Card>
      ) : loading ? (
        <Card>Loading…</Card>
      ) : (
        <Card>
          <div className="space-y-3">
            {mods.map((m) => (
              <label
                key={m.key}
                className="flex items-center justify-between rounded-2xl border border-brand-text/10 bg-brand-bg/50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-brand-text/70">{m.key}</div>
                </div>
                <div className="flex items-center gap-2">
                  {m.key === 'core' ? <span className="text-xs font-semibold text-brand-text/70">Locked</span> : null}
                  <input
                    type="checkbox"
                    checked={m.is_enabled}
                    disabled={m.key === 'core'}
                    onChange={(e) => setEnabled(m.key, e.target.checked)}
                    className="h-5 w-5 accent-[rgb(var(--brand-primary-rgb))]"
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
