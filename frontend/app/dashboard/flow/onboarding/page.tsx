'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createFlowWorkflow, listFlowWorkflows } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function FlowOnboardingPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listFlowWorkflows(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Flow / Onboarding"
      subtitle="תהליכי קליטה"
      accent="#0f766e"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createFlowWorkflow(currentOrg.id, payload)
      }}
      entityLabel="תהליכי קליטה"
      primaryActionLabel="פתיחת תהליך קליטה"
      highlights={['ניהול תאריכי first_day ו-due_date לכל תהליך', 'שימוש בסטטוס draft/in_progress/completed לניהול עומס', 'מעקב SLA לפי תהליכים פתוחים']}
      fields={[
        { key: 'status', label: 'סטטוס', placeholder: 'draft/in_progress/completed' },
        { key: 'start_date', label: 'תאריך התחלה' },
        { key: 'first_day', label: 'יום ראשון' },
        { key: 'due_date', label: 'תאריך יעד' },
      ]}
    />
  )
}
