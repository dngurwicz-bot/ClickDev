'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createAssetItem, listAssetItems } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function AssetItemsPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listAssetItems(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Assets / מלאי"
      subtitle="מעקב ציוד IT"
      accent="#0e7490"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createAssetItem(currentOrg.id, payload)
      }}
      entityLabel="פריטי ציוד"
      primaryActionLabel="הוספת פריט ציוד"
      highlights={['שימוש ב-serial_number ייחודי לכל פריט', 'סטטוסים מומלצים: in_stock/assigned/repair', 'חיפוש מהיר לפי סוג ציוד או שם נכס']}
      fields={[
        { key: 'asset_type', label: 'סוג' },
        { key: 'asset_name', label: 'שם נכס' },
        { key: 'serial_number', label: 'Serial' },
        { key: 'status', label: 'סטטוס' },
      ]}
    />
  )
}
