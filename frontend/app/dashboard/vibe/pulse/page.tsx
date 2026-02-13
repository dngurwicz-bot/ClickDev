'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createPulseSurvey, listPulseSurveys } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function VibePulsePage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listPulseSurveys(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Vibe / Pulse"
      subtitle="סקרי שביעות רצון"
      accent="#be123c"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createPulseSurvey(currentOrg.id, payload)
      }}
      entityLabel="סקרים"
      primaryActionLabel="פתיחת סקר"
      highlights={['קביעת opens_at ו-closes_at ברורים', 'ניהול מחזור חיים בסטטוס draft/open/closed', 'שימוש בסקרים קצרים לשיעור מענה גבוה']}
      fields={[
        { key: 'title', label: 'כותרת' },
        { key: 'status', label: 'סטטוס' },
        { key: 'opens_at', label: 'פתיחה' },
        { key: 'closes_at', label: 'סגירה' },
      ]}
    />
  )
}
