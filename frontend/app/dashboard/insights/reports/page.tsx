'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createInsightsReport, listInsightsReports } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function InsightsReportsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listInsightsReports(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Insights / Reports"
      subtitle="דוחות מותאמים"
      accent="#1e40af"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createInsightsReport(currentOrg.id, payload)
      }}
      entityLabel="דוחות"
      primaryActionLabel="הוספת דוח"
      highlights={['report_key מזהה דוח בצורה קבועה', 'config_json מגדיר פרמטרים והרצה', 'module_key משייך את הדוח לדומיין עסקי']}
      fields={[
        { key: 'report_key', label: 'report_key' },
        { key: 'title', label: 'כותרת' },
        { key: 'config_json', label: 'config JSON' },
        { key: 'module_key', label: 'module' },
      ]}
    />
  )
}
