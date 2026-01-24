'use client'

import { useRouter } from 'next/navigation'
import { JobGradeForm } from '@/components/core/JobGradeForm'
import toast from 'react-hot-toast'

export default function NewGradePage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <JobGradeForm
                onSuccess={() => {
                    toast.success('הדירוג נוסף בהצלחה')
                    router.push('/dashboard/core/grades')
                }}
                onCancel={() => router.push('/dashboard/core/grades')}
            />
        </div>
    )
}
