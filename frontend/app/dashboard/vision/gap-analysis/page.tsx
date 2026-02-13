'use client'

import React from 'react'
import { getVisionGapAnalysis } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'
import { StatusPill } from '@/components/modules/StatusPill'

export default function VisionGapAnalysisPage() {
  const { currentOrg } = useOrganization()
  const [alerts, setAlerts] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const res = await getVisionGapAnalysis(currentOrg.id)
    setAlerts(res.alerts || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  const highCount = alerts.filter((a) => String(a.severity || '').toLowerCase().includes('high')).length
  const mediumCount = alerts.filter((a) => String(a.severity || '').toLowerCase().includes('medium')).length

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="Vision / Gap Analysis"
        subtitle="ניתוח פערי מבנה ארגוני, זיהוי עומסים והתרעות בסיווג חומרה."
        accent="#4c1d95"
      >
        <button onClick={() => void load()} className="rounded-lg bg-[#2f3a7f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#222b5f]">
          הרץ ניתוח
        </button>
      </ModuleHero>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="סה״כ התראות" value={alerts.length} />
        <MetricCard label="High Severity" value={highCount} />
        <MetricCard label="Medium Severity" value={mediumCount} />
        <MetricCard label="עדכון" value="On Demand" note="רענון לפי כפתור ניתוח" />
      </div>

      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className="rounded-xl border border-[#d5e2ea] bg-white p-3 text-sm shadow-sm">
            <div className="font-semibold text-[#1f3f56]">{a.title}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#688399]">
              <span>{a.alert_type}</span>
              <StatusPill status={String(a.severity || 'n/a')} />
            </div>
          </div>
        ))}
        {alerts.length === 0 && <div className="text-sm text-[#688399]">אין התראות כרגע.</div>}
      </div>
    </div>
  )
}
