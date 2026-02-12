'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { JobTitleForm } from '@/components/core/JobTitleForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function EditRolePage() {
    const { goBackOrFallback } = useNavigationStack()
    const { id } = useParams()
    const [initialData, setInitialData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('job_titles')
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
            <JobTitleForm
                initialData={initialData}
                onSuccess={() => {
                    toast.success('התפקיד עודכן בהצלחה')
                    goBackOrFallback('/dashboard/core/roles')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/roles')}
            />
        </div>
    )
}
