'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createInsightsWidget, listInsightsWidgets } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function InsightsDashboardsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listInsightsWidgets(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Insights / Dashboards"
      subtitle="ווידג'טים לדשבורד"
      accent="#1e40af"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createInsightsWidget(currentOrg.id, payload)
      }}
      entityLabel="ווידג'טים"
      primaryActionLabel="הוספת ווידג'ט"
      highlights={['widget_key יציב לשימוש חוזר במסכים', 'config_json מגדיר פילטרים ותצוגה', "module_key מחבר ווידג'ט להקשר עסקי"]}
      fields={[
        { key: 'widget_key', label: 'widget_key' },
        { key: 'title', label: 'כותרת' },
        { key: 'config_json', label: 'config JSON' },
        { key: 'module_key', label: 'module' },
      ]}
    />
  )
}
