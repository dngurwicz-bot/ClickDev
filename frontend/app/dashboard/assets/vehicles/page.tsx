'use client'

import React from 'react'
import { ModuleCrudShell } from '@/components/modules/ModuleCrudShell'
import { createVehicle, listVehicles } from '@/lib/api'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export default function VehiclesPage() {
  const { currentOrg } = useOrganization()
  const [items, setItems] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    if (!currentOrg?.id) return
    const data = await listVehicles(currentOrg.id)
    setItems(data.items || [])
  }, [currentOrg?.id])

  React.useEffect(() => { void load() }, [load])

  return (
    <ModuleCrudShell
      title="Assets / רכבים"
      subtitle="מעקב ביטוחים וטסטים"
      accent="#0e7490"
      items={items}
      onRefresh={load}
      onCreate={async (payload) => {
        if (!currentOrg?.id) return
        await createVehicle(currentOrg.id, payload)
      }}
      entityLabel="רכבים"
      primaryActionLabel="הוספת רכב"
      highlights={['מעקב פוליסות ביטוח ותוקף רישוי', 'שיוך assigned_employee_id לצורך אחריות נהג', 'ניהול active לחסימת רכבים שאינם בתפעול']}
      fields={[
        { key: 'plate_number', label: 'מספר רכב' },
        { key: 'model', label: 'דגם' },
        { key: 'assigned_employee_id', label: 'employee_id' },
        { key: 'active', label: 'פעיל' },
      ]}
    />
  )
}
