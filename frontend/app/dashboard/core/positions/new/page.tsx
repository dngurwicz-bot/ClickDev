'use client'

import { PositionForm } from '@/components/core/PositionForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewPositionPage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <PositionForm
                onSuccess={() => {
                    toast.success('התקן נוסף בהצלחה')
                    goBackOrFallback('/dashboard/core/positions')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/positions')}
            />
        </div>
    )
}
