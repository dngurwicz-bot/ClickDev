'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'
import type { MeResponse, OrgMember } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, Td, Th } from '@/components/ui/Table'

export default function AdminOrgMembersPage() {
  const params = useParams<{ orgId: string }>()
  const orgId = params.orgId

  const [me, setMe] = useState<MeResponse | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [emailOrUserId, setEmailOrUserId] = useState('')
  const [role, setRole] = useState<'org_admin' | 'hr' | 'manager' | 'employee'>('employee')
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
      const res = await apiFetch<OrgMember[]>(`/admin/orgs/${orgId}/members`, token)
      setMembers(res)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [orgId])

  async function add() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const body = emailOrUserId.includes('@')
        ? { email: emailOrUserId, role }
        : { user_id: emailOrUserId, role }
      const res = await apiFetch<OrgMember>(`/admin/orgs/${orgId}/members`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      toast.success('Member added')
      setMembers((prev) => [...prev, res])
      setEmailOrUserId('')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  async function updateRole(memberId: string, newRole: OrgMember['role']) {
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const res = await apiFetch<OrgMember>(`/admin/orgs/${orgId}/members/${memberId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      setMembers((prev) => prev.map((m) => (m.id === memberId ? res : m)))
      toast.success('Role updated')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update role')
    }
  }

  async function remove(memberId: string) {
    try {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      await apiFetch<{ ok: boolean }>(`/admin/orgs/${orgId}/members/${memberId}`, token, { method: 'DELETE' })
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success('Member removed')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to remove member')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">Members</div>
            <div className="mt-1 text-sm text-brand-text/70">{orgId}</div>
          </div>
          <a className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-text/5" href={`/app/admin/orgs/${orgId}`}>
            Back
          </a>
        </div>
      </Card>

      {!isAllowed ? (
        <Card>Unauthorized.</Card>
      ) : (
        <Card>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_140px]">
            <Input
              label="User email or user_id"
              value={emailOrUserId}
              onChange={(e) => setEmailOrUserId(e.target.value)}
              placeholder="user@example.com or UUID"
            />
            <label className="block">
              <div className="mb-1 text-xs font-medium text-brand-text/70">Role</div>
              <select
                className="w-full rounded-xl border border-brand-text/15 bg-brand-surface px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="org_admin">org_admin</option>
                <option value="hr">hr</option>
                <option value="manager">manager</option>
                <option value="employee">employee</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button onClick={add} loading={saving} disabled={!emailOrUserId.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="text-sm text-brand-text/70">Loading…</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-brand-text/70">No members.</div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Created</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-brand-text/2">
                      <Td className="font-mono text-xs">{m.user_id}</Td>
                      <Td>
                        <select
                          className="rounded-xl border border-brand-text/15 bg-brand-surface px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                          value={m.role}
                          onChange={(e) => void updateRole(m.id, e.target.value as any)}
                        >
                          <option value="org_admin">org_admin</option>
                          <option value="hr">hr</option>
                          <option value="manager">manager</option>
                          <option value="employee">employee</option>
                        </select>
                      </Td>
                      <Td className="text-brand-text/70">{new Date(m.created_at).toLocaleString()}</Td>
                      <Td>
                        <Button variant="ghost" onClick={() => void remove(m.id)}>
                          Remove
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
