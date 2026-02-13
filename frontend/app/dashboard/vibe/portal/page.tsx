'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createVibePost, listVibePosts } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function VibePortalPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listVibePosts(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Vibe / פורטל עובד"
      subtitle="פוסטים ולוח מודעות"
      accent="#be123c"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createVibePost(currentOrg.id, payload)
      }}
      entityLabel="פוסטים"
      primaryActionLabel="פרסום פוסט"
      highlights={['שימוש ב-pinned לתקשורת חשובה', 'פרסום ב-published_at לתזמון הודעות', 'תוכן קצר וברור משפר מעורבות']}
      fields={[
        { key: 'title', label: 'כותרת' },
        { key: 'content', label: 'תוכן' },
        { key: 'pinned', label: 'נעוץ' },
        { key: 'published_at', label: 'פרסום' },
      ]}
    />
  )
}
