'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createDocInstance, listDocInstances } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function DocsInstancesPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listDocInstances(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Docs / מסמכים"
      subtitle="הפקת PDF וחתימה"
      accent="#9a3412"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createDocInstance(currentOrg.id, payload)
      }}
      entityLabel="מסמכים"
      primaryActionLabel="הפקת מסמך"
      highlights={['בחירת template_id לפני הפקה', 'מעקב סטטוס מסמך לאורך חיי החתימה', 'שמירת rendered_html לבדיקה ותיעוד']}
      fields={[
        { key: 'template_id', label: 'template_id' },
        { key: 'title', label: 'כותרת' },
        { key: 'status', label: 'סטטוס' },
        { key: 'rendered_html', label: 'תוכן' },
      ]}
    />
  )
}
