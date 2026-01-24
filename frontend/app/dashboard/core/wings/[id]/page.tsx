'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'

export default function EditWingPage() {
    const router = useRouter()
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
                forcedType="Wing"
                onSuccess={() => {
                    toast.success('האגף עודכן בהצלחה')
                    router.push('/dashboard/core/wings')
                }}
                onCancel={() => router.push('/dashboard/core/wings')}
            />
        </div>
    )
}
