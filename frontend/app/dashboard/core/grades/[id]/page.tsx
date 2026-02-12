'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { JobGradeForm } from '@/components/core/JobGradeForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function EditGradePage() {
    const { goBackOrFallback } = useNavigationStack()
    const { id } = useParams()
    const [initialData, setInitialData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('job_grades')
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
            <JobGradeForm
                initialData={initialData}
                onSuccess={() => {
                    toast.success('הדירוג עודכן בהצלחה')
                    goBackOrFallback('/dashboard/core/grades')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/grades')}
            />
        </div>
    )
}
