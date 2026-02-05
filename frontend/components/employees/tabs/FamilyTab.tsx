'use client'

import React from 'react'
import KidsGrid from '@/components/employees/grids/KidsGrid'

interface FamilyTabProps {
    employeeId: string
    organizationId: string
}

export function FamilyTab({ employeeId, organizationId }: FamilyTabProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <h3 className="text-secondary font-bold text-sm">פרטי ילדים ומשפחה</h3>
            </div>

            <KidsGrid employeeId={employeeId} organizationId={organizationId} />
        </div>
    )
}
