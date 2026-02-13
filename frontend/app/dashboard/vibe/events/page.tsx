'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createVibeEvent, listVibeEvents } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function VibeEventsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listVibeEvents(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Vibe / אירועים"
      subtitle="ימי הולדת, ותק וחגים"
      accent="#be123c"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createVibeEvent(currentOrg.id, payload)
      }}
      entityLabel="אירועים"
      primaryActionLabel="יצירת אירוע"
      highlights={['תיעוד event_type אחיד עבור דיווחים', 'שימוש ב-metadata_json להעדפות מתנה/הערות', 'מיון לפי event_date לתכנון חודשי']}
      fields={[
        { key: 'event_type', label: 'סוג אירוע' },
        { key: 'title', label: 'כותרת' },
        { key: 'event_date', label: 'תאריך' },
        { key: 'metadata_json', label: 'metadata JSON' },
      ]}
    />
  )
}
