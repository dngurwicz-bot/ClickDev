'use client'

import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewDivisionPage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Division"
                onSuccess={() => {
                    toast.success('החטיבה נוספה בהצלחה')
                    goBackOrFallback('/dashboard/core/divisions')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/divisions')}
            />
        </div>
    )
}
