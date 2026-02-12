'use client'

import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewTeamPage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Team"
                onSuccess={() => {
                    toast.success('הצוות נוסף בהצלחה')
                    goBackOrFallback('/dashboard/core/teams')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/teams')}
            />
        </div>
    )
}
