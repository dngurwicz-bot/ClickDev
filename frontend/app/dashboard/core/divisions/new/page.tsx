'use client'

import { useRouter } from 'next/navigation'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'

export default function NewDivisionPage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Division"
                onSuccess={() => {
                    toast.success('החטיבה נוספה בהצלחה')
                    router.push('/dashboard/core/divisions')
                }}
                onCancel={() => router.push('/dashboard/core/divisions')}
            />
        </div>
    )
}
