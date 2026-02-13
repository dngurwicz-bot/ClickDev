'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createDocTemplate, listDocTemplates } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function DocsTemplatesPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listDocTemplates(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Docs / תבניות"
      subtitle="Template engine למכתבים"
      accent="#9a3412"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createDocTemplate(currentOrg.id, payload)
      }}
      entityLabel="תבניות"
      primaryActionLabel="יצירת תבנית"
      highlights={['שימוש ב-template_key יציב לכל סוג מכתב', 'תחזוקת placeholders בפורמט JSON', 'שמירה על HTML נקי עבור PDF תקין']}
      fields={[
        { key: 'template_key', label: 'template_key' },
        { key: 'title', label: 'כותרת' },
        { key: 'body_html', label: 'תוכן HTML' },
        { key: 'placeholders', label: 'placeholders JSON' },
      ]}
    />
  )
}
