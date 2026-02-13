'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createGrowReview, listGrowReviews } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function GrowReviewsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listGrowReviews(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Grow / הערכות"
      subtitle="ניהול ביצועים"
      accent="#14532d"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createGrowReview(currentOrg.id, payload)
      }}
      entityLabel="הערכות"
      primaryActionLabel="יצירת הערכה"
      highlights={['שיוך review_cycle_id פעיל בלבד', 'הזנת score עקבית לפי מתודולוגיה ארגונית', 'מעקב סטטוסים draft/submitted/approved']}
      fields={[
        { key: 'review_cycle_id', label: 'cycle_id' },
        { key: 'employee_id', label: 'employee_id' },
        { key: 'status', label: 'סטטוס' },
        { key: 'score', label: 'ציון' },
      ]}
    />
  )
}
