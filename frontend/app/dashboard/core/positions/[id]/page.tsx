'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PositionForm } from '@/components/core/PositionForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function EditPositionPage() {
    const { goBackOrFallback } = useNavigationStack()
    const { id } = useParams()
    const [initialData, setInitialData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('positions')
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
            <PositionForm
                initialData={initialData}
                onSuccess={() => {
                    toast.success('התקן עודכן בהצלחה')
                    goBackOrFallback('/dashboard/core/positions')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/positions')}
            />
        </div>
    )
}
