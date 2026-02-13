'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { MeResponse, Org } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminOrgOverviewPage() {
  const params = useParams<{ orgId: string }>()
  const orgId = params.orgId

  const [me, setMe] = useState<MeResponse | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'active' | 'suspended'>('active')
  const [saving, setSaving] = useState(false)

  const isAllowed = !!me?.is_system_admin

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const supabase = getSupabase()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) return
        const meRes = await apiFetch<MeResponse>('/me', token)
        if (!alive) return
        setMe(meRes)
        if (!meRes.is_system_admin) return
        const orgs = await apiFetch<Org[]>('/admin/orgs', token)
        const found = orgs.find((o) => o.id === orgId) ?? null
        setOrg(found)
        if (found) {
          setName(found.name)
          setStatus(found.status)
        }
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load org')
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [orgId])

  async function save() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const updated = await apiFetch<Org>(`/admin/orgs/${orgId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ name, status }),
      })
      setOrg(updated)
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
            <div className="text-xl font-semibold tracking-tight">Organization</div>
            <div className="mt-1 text-sm text-brand-text/70">{orgId}</div>
          </div>
          <div className="flex gap-2">
            <a className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-text/5" href={`/app/admin/orgs/${orgId}/members`}>
              Members
            </a>
            <a className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-text/5" href={`/app/admin/orgs/${orgId}/modules`}>
              Modules
            </a>
          </div>
        </div>
      </Card>

      {!isAllowed ? (
        <Card>Unauthorized.</Card>
      ) : !org ? (
        <Card>Org not found.</Card>
      ) : (
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="block">
              <div className="mb-1 text-xs font-medium text-brand-text/70">Status</div>
              <select
                className="w-full rounded-xl border border-brand-text/15 bg-brand-surface px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={save} loading={saving} disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
