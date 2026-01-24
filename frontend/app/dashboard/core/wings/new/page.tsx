'use client'

import { useRouter } from 'next/navigation'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'
import toast from 'react-hot-toast'

export default function NewWingPage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <OrgUnitForm
                levels={['Division', 'Wing', 'Department', 'Team']}
                forcedType="Wing"
                onSuccess={() => {
                    toast.success('האגף נוסף בהצלחה')
                    router.push('/dashboard/core/wings')
                }}
                onCancel={() => router.push('/dashboard/core/wings')}
            />
        </div>
    )
}
