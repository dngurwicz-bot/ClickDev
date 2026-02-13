'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { MeResponse, Org } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Td, Th } from '@/components/ui/Table'

export default function AdminOrgsPage() {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const isAllowed = !!me?.is_system_admin

  const title = useMemo(() => (isAllowed ? 'Organizations' : 'Unauthorized'), [isAllowed])

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
      const orgRes = await apiFetch<Org[]>('/admin/orgs', token)
      setOrgs(orgRes)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load orgs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function createOrg() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const org = await apiFetch<Org>('/admin/orgs', token, { method: 'POST', body: JSON.stringify({ name }) })
      toast.success('Org created')
      setOpen(false)
      setName('')
      setOrgs((prev) => [org, ...prev])
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create org')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-brand-text/70">System Super Admin only</div>
          </div>
          {isAllowed ? (
            <Button onClick={() => setOpen(true)}>Create org</Button>
          ) : (
            <span className="text-sm text-brand-text/60">No access</span>
          )}
        </div>
      </Card>

      {loading ? (
        <Card>Loading…</Card>
      ) : !isAllowed ? (
        <Card>Ask a system admin to grant access.</Card>
      ) : orgs.length === 0 ? (
        <Card>No organizations yet.</Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-brand-text/2">
                <Td className="font-medium">{o.name}</Td>
                <Td>{o.status}</Td>
                <Td className="text-brand-text/70">{new Date(o.created_at).toLocaleString()}</Td>
                <Td>
                  <a className="text-sm font-semibold text-brand-primary hover:underline" href={`/app/admin/orgs/${o.id}`}>
                    Manage
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} title="Create Organization" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Input label="Organization name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createOrg} loading={saving} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
