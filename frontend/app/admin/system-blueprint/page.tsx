'use client'

import { useEffect, useMemo, useState } from 'react'
import { authFetch } from '@/lib/api'
import { BlueprintVersionSummary } from '@/lib/types/system-blueprint'

type FullVersionPayload = {
  version: any
  target_companies: any[]
  phases: any[]
  phase_deliverables: any[]
  modules: any[]
  module_capabilities: any[]
  module_kpis: any[]
  channels: any[]
  engines: any[]
  engine_examples: any[]
  escalation: any[]
  core_entities: any[]
  integration_targets: any[]
}

const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000'

async function adminRequest(path: string, method: string = 'GET', body?: unknown) {
  const response = await authFetch(`${backendBase}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const json = await response.json()
      if (json?.detail) detail = String(json.detail)
    } catch {
      // ignore
    }
    throw new Error(detail)
  }
  return response.json()
}

export default function AdminSystemBlueprintPage() {
  const [versions, setVersions] = useState<BlueprintVersionSummary[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [fullData, setFullData] = useState<FullVersionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newVersion, setNewVersion] = useState({
    version_key: '',
    product_name: 'CLICK',
    language: 'he-IL',
    direction: 'rtl',
    positioning: 'ניהול מחזור חיי עובד - המפרט המלא',
    last_updated: new Date().toISOString().slice(0, 10),
  })

  const [moduleForm, setModuleForm] = useState({
    module_key: '',
    display_order: 1,
    name: '',
    category: '',
    for_who: '',
    description: '',
  })

  const [phaseForm, setPhaseForm] = useState({
    phase_number: 1,
    name: '',
    duration_weeks: 1,
  })

  const [channelForm, setChannelForm] = useState({ channel_key: '', sort_order: 1 })
  const [engineForm, setEngineForm] = useState({ name: '', sort_order: 1 })
  const [entityForm, setEntityForm] = useState({ entity_name: '', sort_order: 1 })
  const [integrationForm, setIntegrationForm] = useState({ target_name: '', sort_order: 1 })
  const [companyForm, setCompanyForm] = useState({ company_type: '', sort_order: 1 })

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId),
    [versions, selectedVersionId]
  )

  async function loadVersions() {
    const data = await adminRequest('/api/admin/system-blueprint/versions')
    setVersions(data)
    if (!selectedVersionId && data.length > 0) {
      setSelectedVersionId(data[0].id)
    }
  }

  async function loadFullVersion(versionId: string) {
    if (!versionId) {
      setFullData(null)
      return
    }
    const data = await adminRequest(`/api/admin/system-blueprint/versions/${versionId}/full`)
    setFullData(data)
  }

  async function reloadAll(versionId?: string) {
    setLoading(true)
    setError(null)
    try {
      await loadVersions()
      const targetId = versionId || selectedVersionId
      if (targetId) {
        await loadFullVersion(targetId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedVersionId) {
      loadFullVersion(selectedVersionId).catch((e) => setError(e.message))
    }
  }, [selectedVersionId])

  async function handleCreateVersion() {
    setBusy(true)
    setError(null)
    try {
      const created = await adminRequest('/api/admin/system-blueprint/versions', 'POST', newVersion)
      await loadVersions()
      setSelectedVersionId(created.id)
      await loadFullVersion(created.id)
      setNewVersion((prev) => ({ ...prev, version_key: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed creating version')
    } finally {
      setBusy(false)
    }
  }

  async function handlePublish() {
    if (!selectedVersionId) return
    setBusy(true)
    setError(null)
    try {
      await adminRequest(`/api/admin/system-blueprint/versions/${selectedVersionId}/publish`, 'POST')
      await reloadAll(selectedVersionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed publishing')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateModule() {
    if (!selectedVersionId) return
    setBusy(true)
    setError(null)
    try {
      await adminRequest('/api/admin/system-blueprint/modules', 'POST', {
        ...moduleForm,
        version_id: selectedVersionId,
      })
      await loadFullVersion(selectedVersionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed creating module')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreatePhase() {
    if (!selectedVersionId) return
    setBusy(true)
    setError(null)
    try {
      await adminRequest('/api/admin/system-blueprint/phases', 'POST', {
        ...phaseForm,
        version_id: selectedVersionId,
      })
      await loadFullVersion(selectedVersionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed creating phase')
    } finally {
      setBusy(false)
    }
  }

  async function addSimpleRow(path: string, payload: Record<string, unknown>) {
    if (!selectedVersionId) return
    setBusy(true)
    setError(null)
    try {
      await adminRequest(path, 'POST', { ...payload, version_id: selectedVersionId })
      await loadFullVersion(selectedVersionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed creating row')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-700">טוען Blueprint...</div>
  }

  return (
    <div className="space-y-6 p-4 md:p-8" dir="rtl">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">ניהול System Blueprint</h1>
        <p className="mt-2 text-sm text-slate-600">
          ניהול גרסאות, מודולים, שלבי הטמעה והתראות. פרסום זמין רק כשהנתונים עומדים בכללי ולידציה.
        </p>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
        <input
          value={newVersion.version_key}
          onChange={(e) => setNewVersion({ ...newVersion, version_key: e.target.value })}
          placeholder="גרסה (למשל 3.1)"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          value={newVersion.last_updated}
          onChange={(e) => setNewVersion({ ...newVersion, last_updated: e.target.value })}
          type="date"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <button
          disabled={busy || !newVersion.version_key}
          onClick={handleCreateVersion}
          className="rounded bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          יצירת גרסה
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            className="min-w-[260px] rounded border border-slate-300 px-3 py-2"
          >
            <option value="">בחר גרסה</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.version_key} | {version.product_name} {version.is_published ? '(Published)' : ''}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !selectedVersionId}
            onClick={handlePublish}
            className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            פרסם גרסה נבחרת
          </button>
        </div>
        {selectedVersion && (
          <p className="text-sm text-slate-600">
            מצב גרסה: <strong>{selectedVersion.is_published ? 'Published' : 'Draft'}</strong> | עודכן: {selectedVersion.updated_at}
          </p>
        )}
      </section>

      {fullData && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">מודולים</h2>
            <div className="grid gap-2 md:grid-cols-6">
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="module_key" value={moduleForm.module_key} onChange={(e) => setModuleForm({ ...moduleForm, module_key: e.target.value })} />
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="order" type="number" value={moduleForm.display_order} onChange={(e) => setModuleForm({ ...moduleForm, display_order: Number(e.target.value) })} />
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="name" value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} />
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="category" value={moduleForm.category} onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })} />
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="for_who" value={moduleForm.for_who} onChange={(e) => setModuleForm({ ...moduleForm, for_who: e.target.value })} />
              <button disabled={busy} onClick={handleCreateModule} className="rounded bg-slate-800 px-3 py-2 text-white disabled:opacity-60">הוסף מודול</button>
            </div>
            <textarea className="mt-2 w-full rounded border border-slate-300 px-2 py-2" placeholder="description" value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} />
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {fullData.modules.map((module) => (
                <li key={module.id} className="rounded border border-slate-200 p-2">
                  #{module.display_order} {module.name} ({module.module_key})
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">שלבי הטמעה</h2>
            <div className="grid gap-2 md:grid-cols-4">
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="phase" type="number" value={phaseForm.phase_number} onChange={(e) => setPhaseForm({ ...phaseForm, phase_number: Number(e.target.value) })} />
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="name" value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} />
              <input className="rounded border border-slate-300 px-2 py-2" placeholder="weeks" type="number" value={phaseForm.duration_weeks} onChange={(e) => setPhaseForm({ ...phaseForm, duration_weeks: Number(e.target.value) })} />
              <button disabled={busy} onClick={handleCreatePhase} className="rounded bg-slate-800 px-3 py-2 text-white disabled:opacity-60">הוסף שלב</button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {fullData.phases.map((phase) => (
                <li key={phase.id} className="rounded border border-slate-200 p-2">
                  שלב {phase.phase_number}: {phase.name} ({phase.duration_weeks} שבועות)
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <SimpleListEditor
              title="Target Companies"
              rows={fullData.target_companies}
              primaryField="company_type"
              orderField="sort_order"
              formValue={companyForm}
              setFormValue={setCompanyForm}
              onAdd={() => addSimpleRow('/api/admin/system-blueprint/target-companies', companyForm)}
            />
            <SimpleListEditor
              title="Notification Channels"
              rows={fullData.channels}
              primaryField="channel_key"
              orderField="sort_order"
              formValue={channelForm}
              setFormValue={setChannelForm}
              onAdd={() => addSimpleRow('/api/admin/system-blueprint/notification-channels', channelForm)}
            />
            <SimpleListEditor
              title="Alert Engines"
              rows={fullData.engines}
              primaryField="name"
              orderField="sort_order"
              formValue={engineForm}
              setFormValue={setEngineForm}
              onAdd={() => addSimpleRow('/api/admin/system-blueprint/alert-engines', engineForm)}
            />
            <SimpleListEditor
              title="Core Entities"
              rows={fullData.core_entities}
              primaryField="entity_name"
              orderField="sort_order"
              formValue={entityForm}
              setFormValue={setEntityForm}
              onAdd={() => addSimpleRow('/api/admin/system-blueprint/core-entities', entityForm)}
            />
            <SimpleListEditor
              title="Integration Targets"
              rows={fullData.integration_targets}
              primaryField="target_name"
              orderField="sort_order"
              formValue={integrationForm}
              setFormValue={setIntegrationForm}
              onAdd={() => addSimpleRow('/api/admin/system-blueprint/integration-targets', integrationForm)}
            />
          </section>
        </>
      )}
    </div>
  )
}

function SimpleListEditor({
  title,
  rows,
  primaryField,
  orderField,
  formValue,
  setFormValue,
  onAdd,
}: {
  title: string
  rows: any[]
  primaryField: string
  orderField: string
  formValue: any
  setFormValue: (v: any) => void
  onAdd: () => void
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        <input
          className="col-span-2 rounded border border-slate-300 px-2 py-2"
          placeholder={primaryField}
          value={formValue[primaryField] || ''}
          onChange={(e) => setFormValue({ ...formValue, [primaryField]: e.target.value })}
        />
        <input
          className="rounded border border-slate-300 px-2 py-2"
          type="number"
          placeholder={orderField}
          value={formValue[orderField] || 1}
          onChange={(e) => setFormValue({ ...formValue, [orderField]: Number(e.target.value) })}
        />
      </div>
      <button onClick={onAdd} className="mt-2 rounded bg-slate-800 px-3 py-2 text-white">
        הוסף
      </button>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {rows.map((row) => (
          <li key={row.id} className="rounded border border-slate-200 p-2">
            {row[primaryField]} (#{row[orderField]})
          </li>
        ))}
      </ul>
    </section>
  )
}
