'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PositionForm } from '@/components/core/PositionForm'
import toast from 'react-hot-toast'

export default function EditPositionPage() {
    const router = useRouter()
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
                    router.push('/dashboard/core/positions')
                }}
                onCancel={() => router.push('/dashboard/core/positions')}
            />
        </div>
    )
}
