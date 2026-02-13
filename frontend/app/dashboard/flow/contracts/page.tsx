'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createFlowContract, listFlowContracts } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function FlowContractsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listFlowContracts(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Flow / חוזים"
      subtitle="חוזי העסקה וחתימה"
      accent="#0f766e"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createFlowContract(currentOrg.id, payload)
      }}
      entityLabel="חוזים"
      primaryActionLabel="יצירת חוזה"
      highlights={['מעקב סטטוס חתימה draft/sent/signed', 'קישור template_id לכל חוזה חדש', 'תיעוד URL PDF עבור שיתוף וארכוב']}
      fields={[
        { key: 'employee_id', label: 'employee_id' },
        { key: 'status', label: 'סטטוס', placeholder: 'draft/sent/signed' },
        { key: 'generated_pdf_url', label: 'PDF URL' },
        { key: 'template_id', label: 'template_id' },
      ]}
    />
  )
}
