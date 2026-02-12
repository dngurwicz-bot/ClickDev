'use client'

import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewDepartmentPage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Department"
                onSuccess={() => {
                    toast.success('המחלקה נוספה בהצלחה')
                    goBackOrFallback('/dashboard/core/departments')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/departments')}
            />
        </div>
    )
}
