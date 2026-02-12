'use client'

import { JobGradeForm } from '@/components/core/JobGradeForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewGradePage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <JobGradeForm
                onSuccess={() => {
                    toast.success('הדירוג נוסף בהצלחה')
                    goBackOrFallback('/dashboard/core/grades')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/grades')}
            />
        </div>
    )
}
