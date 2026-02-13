'use client'

import React from 'react'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'
import { StatusPill } from '@/components/modules/StatusPill'

interface ModuleCrudShellProps {
  title: string
  subtitle?: string
  accent?: string
  items: any[]
  onRefresh: () => Promise<void>
  onCreate: (payload: Record<string, unknown>) => Promise<void>
  fields: { key: string; label: string; placeholder?: string }[]
  highlights?: string[]
  entityLabel?: string
  primaryActionLabel?: string
}

export function ModuleCrudShell({
  title,
  subtitle,
  accent,
  items,
  onRefresh,
  onCreate,
  fields,
  highlights = [],
  entityLabel = 'רשומות',
  primaryActionLabel = 'הוספת רשומה',
}: ModuleCrudShellProps) {
  const [form, setForm] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [selectedId, setSelectedId] = React.useState<string | number | null>(null)

  const statusField = React.useMemo(
    () => fields.find((f) => f.key.toLowerCase().includes('status') || f.key.toLowerCase().includes('stage'))?.key,
    [fields],
  )

  const filteredItems = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) =>
      fields.some((field) => String(item[field.key] ?? '').toLowerCase().includes(term)),
    )
  }, [fields, items, query])

  const selectedItem = React.useMemo(
    () => filteredItems.find((item) => String(item.id) === String(selectedId)) || filteredItems[0] || null,
    [filteredItems, selectedId],
  )

  const statusSummary = React.useMemo(() => {
    if (!statusField) return []
    const map = new Map<string, number>()
    for (const item of items) {
      const key = String(item[statusField] || 'unknown')
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [items, statusField])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await onCreate(form)
      setForm({})
      await onRefresh()
    } finally {
      setSaving(false)
    }
  }

  React.useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        void handleCreate()
      }
      if (event.key === 'Escape') {
        setQuery('')
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero title={title} subtitle={subtitle || ''} accent={accent} />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label={`סה"כ ${entityLabel}`} value={items.length} />
        <MetricCard label="תוצאות סינון" value={filteredItems.length} note={query ? `חיפוש: ${query}` : 'ללא סינון'} />
        <MetricCard label="שדות יצירה" value={fields.length} note="הזנה מהירה" />
        <MetricCard label="ניווט מקלדת" value="ESC / Ctrl+Enter" note="ESC לניקוי חיפוש" />
      </div>

      {(highlights.length > 0 || statusSummary.length > 0) && (
        <section className="rounded-2xl border border-[#d7e5ef] bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#1f3f56]">דגשים תפעוליים</h3>
                <ul className="mt-2 space-y-1 text-xs text-[#456579]">
                  {highlights.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {statusSummary.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#1f3f56]">סטטוסים מובילים</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {statusSummary.map((entry) => (
                    <div key={entry.status} className="inline-flex items-center gap-2 rounded-lg border border-[#e0ecf4] px-2 py-1">
                      <StatusPill status={entry.status} />
                      <span className="text-xs text-[#456579]">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#d5e2ea] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f1f6] px-3 py-2">
            <div className="text-sm font-semibold text-[#1f4964]">{entityLabel}</div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש מהיר..."
                className="h-9 rounded-lg border border-[#c8dbe7] px-3 text-sm outline-none focus:border-[#3d8bb8]"
              />
              <button
                onClick={() => void onRefresh()}
                className="h-9 rounded-lg border border-[#c8dbe7] bg-white px-3 text-xs font-semibold text-[#1f4964] hover:bg-[#f4f9fc]"
              >
                רענון
              </button>
            </div>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f6fbfe]">
                <tr>
                  {fields.map((field) => (
                    <th key={field.key} className="border-b border-[#e8f1f6] px-3 py-2 font-semibold text-[#3c5f75]">
                      {field.label}
                    </th>
                  ))}
                  <th className="border-b border-[#e8f1f6] px-3 py-2 font-semibold text-[#3c5f75]">id</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer border-b border-[#f0f4f7] hover:bg-[#f8fcff] ${String(selectedItem?.id) === String(item.id) ? 'bg-[#eef6fb]' : ''}`}
                  >
                    {fields.map((field) => (
                      <td key={field.key} className="px-3 py-2">
                        {statusField === field.key ? <StatusPill status={String(item[field.key] ?? '')} /> : String(item[field.key] ?? '')}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-[#688399]">{item.id}</td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={fields.length + 1} className="px-3 py-8 text-center text-[#688399]">
                      אין נתונים להצגה.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#d5e2ea] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#1f4964]">{primaryActionLabel}</h3>
            <div className="mt-3 grid gap-2">
              {fields.map((field) => (
                <input
                  key={field.key}
                  value={form[field.key] || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder || field.label}
                  className="h-9 rounded-lg border border-[#c8dbe7] px-3 text-sm outline-none focus:border-[#3d8bb8]"
                />
              ))}
              <button
                onClick={() => void handleCreate()}
                disabled={saving}
                className="h-10 rounded-lg bg-[#1f4964] px-3 text-sm font-semibold text-white hover:bg-[#16384d] disabled:opacity-60"
              >
                {saving ? 'שומר...' : primaryActionLabel}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#d5e2ea] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#1f4964]">פרטי רשומה נבחרת</h3>
            {!selectedItem && <p className="mt-2 text-xs text-[#688399]">בחר רשומה מהטבלה לצפייה מהירה.</p>}
            {selectedItem && (
              <div className="mt-3 space-y-2">
                {fields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-[#ebf2f7] px-3 py-2">
                    <div className="text-[11px] font-semibold text-[#688399]">{field.label}</div>
                    <div className="mt-1 text-sm text-[#1f3f56]">
                      {statusField === field.key ? <StatusPill status={String(selectedItem[field.key] ?? '')} /> : String(selectedItem[field.key] ?? '-')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}
