'use client'

import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewWingPage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Wing"
                onSuccess={() => {
                    toast.success('האגף נוסף בהצלחה')
                    goBackOrFallback('/dashboard/core/wings')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/wings')}
            />
        </div>
    )
}
