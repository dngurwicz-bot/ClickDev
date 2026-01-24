'use client'

import { useRouter } from 'next/navigation'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'

export default function NewTeamPage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Team"
                onSuccess={() => {
                    toast.success('הצוות נוסף בהצלחה')
                    router.push('/dashboard/core/teams')
                }}
                onCancel={() => router.push('/dashboard/core/teams')}
            />
        </div>
    )
}
