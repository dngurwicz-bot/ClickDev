'use client'

import { useRouter } from 'next/navigation'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'

export default function NewDepartmentPage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Department"
                onSuccess={() => {
                    toast.success('המחלקה נוספה בהצלחה')
                    router.push('/dashboard/core/departments')
                }}
                onCancel={() => router.push('/dashboard/core/departments')}
            />
        </div>
    )
}
