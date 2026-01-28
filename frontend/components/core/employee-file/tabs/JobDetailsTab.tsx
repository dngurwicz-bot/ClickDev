'use client'

import { useState, useMemo } from 'react'
import { HilanModuleLayout } from '../HilanModuleLayout'
import { HistoryTable } from '../HistoryTable'
import { EmployeeForm } from '@/components/core/EmployeeForm'

interface JobDetailsTabProps {
    employee: any
    onSuccess?: () => void
    onOverviewClick?: () => void
}

export function JobDetailsTab({ employee, onSuccess, onOverviewClick }: JobDetailsTabProps) {
    const [activeEvent, setActiveEvent] = useState('203')
    const [editingEvent, setEditingEvent] = useState<string | null>(null)

    const menuItems = useMemo(() => [
        { id: '201', label: 'הפסקה או חידוש עבודה', code: '201' },
        { id: '203', label: 'דרוג / דרגה', code: '203' },
        { id: '204', label: 'פיצול משרה', code: '204' },
    ], [])

    const handleSuccess = () => {
        setEditingEvent(null)
        if (onSuccess) onSuccess()
    }

    const renderContent = () => {
        switch (activeEvent) {
            case '203':
                return (
                    <div className="space-y-4">
                        <HistoryTable
                            employeeId={employee.id}
                            title="דרוג / דרגה"
                            eventCode="203"
                            isEditing={editingEvent === '203'}
                            onAddClick={() => setEditingEvent(editingEvent === '203' ? null : '203')}
                            columns={[
                                { key: 'job_title', label: 'תפקיד' },
                                { key: 'rank_id', label: 'דירוג' },
                                { key: 'grade_id', label: 'דרגה' },
                                { key: 'department', label: 'מחלקה' },
                            ]}
                        />

                        {editingEvent === '203' && (
                            <div className="border-t-2 border-blue-500 pt-4 animate-in slide-in-from-top duration-300">
                                <EmployeeForm
                                    initialData={employee}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setEditingEvent(null)}
                                    onlySections={['job']}
                                    eventCode="203"
                                />
                            </div>
                        )}
                    </div>
                )
            case '201':
                return (
                    <div className="space-y-4">
                        <HistoryTable
                            employeeId={employee.id}
                            title="הפסקה או חידוש עבודה"
                            eventCode="201"
                            isEditing={editingEvent === '201'}
                            onAddClick={() => setEditingEvent(editingEvent === '201' ? null : '201')}
                            columns={[
                                { key: 'status_code', label: 'קוד מצב' },
                                { key: 'status_name', label: 'תיאור מצב' },
                                { key: 'reason', label: 'סיבה' },
                            ]}
                        />
                        {/* We don't have a 201 form section yet in EmployeeForm, 
                            but the history table is prominent now. */}
                    </div>
                )
            case '204':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-100 italic">
                            אירוע זה משמש לפיצול עלויות שכר בין מרכזי רווח. אין נתונים להצגה כרגע.
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <HilanModuleLayout
            menuItems={menuItems}
            activeItemId={activeEvent}
            onItemSelect={(id) => {
                setActiveEvent(id)
                setEditingEvent(null)
            }}
            title="פרטי העסקה ותפקידים"
            onOverviewClick={onOverviewClick}
        >
            {renderContent()}
        </HilanModuleLayout>
    )
}
