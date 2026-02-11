'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Table001Form, { Table001Data } from './tables/Table001Form'
import Table101Form, { Table101Data } from './tables/Table101Form'
import { useParams } from 'next/navigation'

// Table definitions for the employee file
interface EmployeeTable {
    id: string
    name: string
    description: string
    category: 'personal' | 'employment' | 'hr' | 'documents' | 'favorites'
    disabled?: boolean
}

export const employeeTables: EmployeeTable[] = [
    {
        id: '001',
        name: 'פתיחת עובד',
        description: 'נתונים בסיסיים של העובד',
        category: 'personal',
        disabled: false
    },
    {
        id: '100',
        name: 'שינוי שם',
        description: 'שינוי שם עובד עם היסטוריה',
        category: 'personal',
        disabled: true // Not yet implemented
    },
    {
        id: '101',
        name: 'כתובת',
        description: 'כתובת העובד ופרטי התקשרות',
        category: 'personal',
        disabled: false
    },
]

export type TableId = string

interface TableListProps {
    category?: 'personal' | 'employment' | 'hr' | 'documents' | 'favorites'
    onSelectTable?: (tableId: TableId) => void
    employeeId?: string
}

export function TableList({ category, onSelectTable, employeeId }: TableListProps) {
    const filteredTables = category
        ? employeeTables.filter(t => t.category === category)
        : employeeTables

    return (
        <div className="space-y-2">
            {filteredTables.map((table) => (
                <Card
                    key={table.id}
                    className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                        table.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !table.disabled && onSelectTable?.(table.id)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {table.id}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{table.name}</h4>
                                <p className="text-xs text-gray-500">{table.description}</p>
                            </div>
                        </div>
                        {!table.disabled && (
                            <ChevronLeft className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                </Card>
            ))}
        </div>
    )
}

interface EmployeeTableViewerProps {
    tableId: TableId
    employeeId?: string
    mode?: 'view' | 'add' | 'edit'
    onBack?: () => void
    onSave?: (tableId: TableId, data: unknown) => void
}

export function EmployeeTableViewer({
    tableId,
    employeeId,
    mode = 'view',
    onBack,
    onSave
}: EmployeeTableViewerProps) {
    const handleSaveInner = (data: any) => {
        onSave?.(tableId, data)
    }

    switch (tableId) {
        case '001':
            return (
                <Table001Form
                    mode={mode}
                    onSave={handleSaveInner}
                    onCancel={onBack}
                    onExit={onBack}
                />
            )
        case '100':
            // TODO: Implement Table 100 - Name Change
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>טבלה 100 - שינוי שם</p>
                        <p className="text-sm mt-2">בפיתוח...</p>
                    </div>
                </div>
            )
        case '101':
            return (
                <Table101Form
                    mode={mode}
                    onSave={handleSaveInner}
                    onCancel={onBack}
                    onExit={onBack}
                />
            )
        default:
            return (
                <div className="flex items-center justify-center h-full text-gray-500">
                    טבלה לא נמצאה
                </div>
            )
    }
}

// Combined component for managing tables in employee file
interface EmployeeTablesManagerProps {
    category?: 'personal' | 'employment' | 'hr' | 'documents' | 'favorites'
    employeeId?: string
}

export function EmployeeTablesManager({ category, employeeId }: EmployeeTablesManagerProps) {
    const [selectedTable, setSelectedTable] = useState<TableId | null>(null)
    const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view')
    const params = useParams()
    const orgId = params.orgId as string

    const handleSelectTable = (tableId: TableId) => {
        setSelectedTable(tableId)
        setMode('view')
    }

    const handleBack = () => {
        setSelectedTable(null)
    }

    const handleSave = async (tableId: TableId, data: any) => {
        console.log('Saving table data:', tableId, data)
        try {
            const response = await fetch(`/api/organizations/${orgId}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
                },
                body: JSON.stringify({
                    operation_code: 'ADD', // For now, default to ADD (new event)
                    event_code: tableId,
                    data: data
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Failed to save')
            }

            alert('הנתונים נשמרו בהצלחה')
            setSelectedTable(null)
        } catch (error: any) {
            console.error('Error saving table:', error)
            alert('שגיאה בשמירת הנתונים: ' + error.message)
        }
    }

    if (selectedTable) {
        return (
            <div className="h-full">
                <EmployeeTableViewer
                    tableId={selectedTable}
                    employeeId={employeeId}
                    mode={mode}
                    onBack={handleBack}
                    onSave={handleSave}
                />
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <h3 className="font-bold text-gray-700 mb-2">טבלאות זמינות</h3>
                <p className="text-sm text-gray-500">בחר טבלה לצפייה או עריכה</p>
            </div>
            <TableList
                category={category}
                onSelectTable={handleSelectTable}
                employeeId={employeeId}
            />
        </div>
    )
}
