'use client'

import { useRouter } from 'next/navigation'
import SetupWizard from '@/components/core/SetupWizard'

export default function WizardPage() {
    const router = useRouter()

    return (
        <SetupWizard
            isOpen={true}
            onClose={() => router.push('/dashboard/core')}
        />
    )
}
