'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { JobGradeForm } from '@/components/core/JobGradeForm'
import toast from 'react-hot-toast'

export default function EditGradePage() {
    const router = useRouter()
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
                    router.push('/dashboard/core/grades')
                }}
                onCancel={() => router.push('/dashboard/core/grades')}
            />
        </div>
    )
}
