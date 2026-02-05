'use client'

import React from 'react'
import RoleHistoryGrid from '@/components/employees/grids/RoleHistoryGrid'

interface RoleHistoryTabProps {
    employeeId: string
    organizationId: string
}

export function RoleHistoryTab({ employeeId, organizationId }: RoleHistoryTabProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <h3 className="text-secondary font-bold text-sm">היסטוריית תפקידים ושיבוץ</h3>
            </div>

            <RoleHistoryGrid employeeId={employeeId} organizationId={organizationId} />
        </div>
    )
}
