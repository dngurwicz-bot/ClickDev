'use client'

import { useRouter } from 'next/navigation'
import { JobTitleForm } from '@/components/core/JobTitleForm'
import toast from 'react-hot-toast'

export default function NewTitlePage() {
    const router = useRouter()

    return (
        <div className="h-full flex flex-col">
            <JobTitleForm
                onSuccess={() => {
                    toast.success('התפקיד נוסף בהצלחה')
                    router.push('/dashboard/core/titles')
                }}
                onCancel={() => router.push('/dashboard/core/titles')}
            />
        </div>
    )
}
