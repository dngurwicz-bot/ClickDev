'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createInsightsKpi, listInsightsKpis } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function InsightsKpisPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listInsightsKpis(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Insights / KPIs"
      subtitle="הגדרות מדדים"
      accent="#1e40af"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createInsightsKpi(currentOrg.id, payload)
      }}
      entityLabel="מדדים"
      primaryActionLabel="הוספת KPI"
      highlights={['כל kpi_key חייב להיות ייחודי ברמת מודול', 'query_config בפורמט JSON ולוגיקה מוסברת', 'תיעוד title ברור עבור הנהלה']}
      fields={[
        { key: 'module_key', label: 'module_key' },
        { key: 'kpi_key', label: 'kpi_key' },
        { key: 'title', label: 'כותרת' },
        { key: 'query_config', label: 'config JSON' },
      ]}
    />
  )
}
