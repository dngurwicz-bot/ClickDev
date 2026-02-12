'use client'

import { JobTitleForm } from '@/components/core/JobTitleForm'
import toast from 'react-hot-toast'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export default function NewRolePage() {
    const { goBackOrFallback } = useNavigationStack()

    return (
        <div className="h-full flex flex-col">
            <JobTitleForm
                onSuccess={() => {
                    toast.success('התפקיד נוסף בהצלחה')
                    goBackOrFallback('/dashboard/core/roles')
                }}
                onCancel={() => goBackOrFallback('/dashboard/core/roles')}
            />
        </div>
    )
}
