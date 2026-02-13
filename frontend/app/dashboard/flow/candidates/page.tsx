'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createFlowCandidate, listFlowCandidates } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function FlowCandidatesPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listFlowCandidates(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Flow / מועמדים"
      subtitle="ניהול pipeline גיוס"
      accent="#0f766e"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createFlowCandidate(currentOrg.id, payload)
      }}
      entityLabel="מועמדים"
      primaryActionLabel="פתיחת מועמד"
      highlights={['מעקב מעבר שלב מ-new ל-interview ול-offer', 'הקפדה על אימייל תקין לפני קידום מועמד', 'מיון מהיר לפי חיפוש שם או סטטוס']}
      fields={[
        { key: 'first_name', label: 'שם פרטי' },
        { key: 'last_name', label: 'שם משפחה' },
        { key: 'email', label: 'אימייל' },
        { key: 'stage', label: 'שלב', placeholder: 'new/interview/offer' },
      ]}
    />
  )
}
