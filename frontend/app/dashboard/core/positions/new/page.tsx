'use client'

import { useRouter } from 'next/navigation'
import { PositionForm } from '@/components/core/PositionForm'
import toast from 'react-hot-toast'

export default function NewPositionPage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <PositionForm
                onSuccess={() => {
                    toast.success('התקן נוסף בהצלחה')
                    router.push('/dashboard/core/positions')
                }}
                onCancel={() => router.push('/dashboard/core/positions')}
            />
        </div>
    )
}
