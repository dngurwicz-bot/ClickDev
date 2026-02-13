'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createGrowGoal, listGrowGoals } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function GrowGoalsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listGrowGoals(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Grow / יעדים"
      subtitle="יעדים וצ'ק-אינים"
      accent="#14532d"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createGrowGoal(currentOrg.id, payload)
      }}
      entityLabel="יעדים"
      primaryActionLabel="הוספת יעד"
      highlights={['מדד progress_pct בין 0 ל-100', 'שימוש בסטטוס on_track/at_risk/completed', 'עדכון יעד בצמוד לשיחות ניהוליות']}
      fields={[
        { key: 'employee_id', label: 'employee_id' },
        { key: 'title', label: 'יעד' },
        { key: 'status', label: 'סטטוס' },
        { key: 'progress_pct', label: 'התקדמות %' },
      ]}
    />
  )
}
