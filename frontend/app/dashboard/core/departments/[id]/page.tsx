'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function EditDepartmentPage() {
    const { goBackOrFallback } = useNavigationStack()
    const { id } = useParams()
    const [initialData, setInitialData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('org_units')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setInitialData(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) return <div className="p-8">טוען...</div>

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                initialData={initialData}
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Department"
                onSuccess={() => {
                    toast.success('המחלקות עודכנה בהצלחה')
                    goBackOrFallback('/dashboard/core/departments')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/departments')}
            />
        </div>
    )
}
