'use client'

import React from 'react'
import { getVisionLive } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function VisionOrgChartPage() {
  const { currentOrg } = useOrganization()
  const [data, setData] = React.useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] })

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const res = await getVisionLive(currentOrg.id)
    setData(res)
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  const employeesCount = data.nodes.filter((n) => n.entity_type === 'employee').length
  const unitsCount = data.nodes.filter((n) => n.entity_type && n.entity_type !== 'employee').length

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="Vision / Org Chart"
        subtitle="מפת הארגון בזמן אמת: קשרי כפיפות, עומק ניהולי וזיהוי מוקדי עומס."
        accent="#4c1d95"
      >
        <button onClick={() => void load()} className="rounded-lg border border-[#d1d9ff] bg-white px-3 py-2 text-xs font-semibold text-[#2f3a7f]">
          רענן תרשים
        </button>
      </ModuleHero>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="סה״כ Nodes" value={data.nodes.length} />
        <MetricCard label="סה״כ Edges" value={data.edges.length} />
        <MetricCard label="עובדים" value={employeesCount} />
        <MetricCard label="יחידות ארגון" value={unitsCount} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#d5e2ea] bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-[#1f3f56]">Nodes ({data.nodes.length})</h3>
          <div className="max-h-[430px] space-y-1 overflow-auto text-xs">
            {data.nodes.map((n) => (
              <div key={n.id} className="rounded-lg border border-[#eef5f9] p-2">
                {n.label} ({n.entity_type})
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#d5e2ea] bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-[#1f3f56]">Edges ({data.edges.length})</h3>
          <div className="max-h-[430px] space-y-1 overflow-auto text-xs">
            {data.edges.map((e, i) => (
              <div key={i} className="rounded-lg border border-[#eef5f9] p-2">
                {e.from} → {e.to}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
