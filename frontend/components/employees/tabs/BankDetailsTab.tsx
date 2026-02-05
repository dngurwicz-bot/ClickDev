'use client'

import React from 'react'
import BankDetailsGrid from '@/components/employees/grids/BankDetailsGrid'

interface BankDetailsTabProps {
    employeeId: string
    organizationId: string
}

export function BankDetailsTab({ employeeId, organizationId }: BankDetailsTabProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <h3 className="text-secondary font-bold text-sm">פרטי חשבון בנק לעובד</h3>
            </div>

            <BankDetailsGrid employeeId={employeeId} organizationId={organizationId} />

            <div className="text-[10px] text-gray-500 mt-2">
                * שינוי פרטי בנק נשמר באופן אוטומטי בעת הקלדה.
            </div>
        </div>
    )
}
