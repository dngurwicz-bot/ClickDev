'use client'

import React from 'react'
import AssetsGrid from '@/components/employees/grids/AssetsGrid'

interface AssetsTabProps {
    employeeId: string
    organizationId: string
}

export function AssetsTab({ employeeId, organizationId }: AssetsTabProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <h3 className="text-secondary font-bold text-sm">ציוד ורכוש חברה (Assets)</h3>
            </div>

            <AssetsGrid employeeId={employeeId} organizationId={organizationId} />

            <div className="text-[10px] text-gray-500 mt-2">
                * תיעוד ציוד שנמסר לעובד (מחשב, טלפון, רכב וכו').
            </div>
        </div>
    )
}
