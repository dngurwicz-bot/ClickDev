'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createGrowReviewCycle, listGrowReviewCycles } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function GrowCyclesPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listGrowReviewCycles(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Grow / מחזורי הערכה"
      subtitle="ניהול מחזורי משוב"
      accent="#14532d"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createGrowReviewCycle(currentOrg.id, payload)
      }}
      entityLabel="מחזורים"
      primaryActionLabel="פתיחת מחזור הערכה"
      highlights={['תקופת period_start/period_end חייבת להיות ברורה', 'סטטוסים מומלצים: planned/active/closed', 'סגירת מחזור רק אחרי השלמת הערכות']}
      fields={[
        { key: 'name', label: 'שם מחזור' },
        { key: 'status', label: 'סטטוס' },
        { key: 'period_start', label: 'מתחיל' },
        { key: 'period_end', label: 'מסתיים' },
      ]}
    />
  )
}
