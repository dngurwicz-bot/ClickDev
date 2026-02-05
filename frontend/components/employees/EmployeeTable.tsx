'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table'
import { mockEmployees } from '@/app/dashboard/core/employees/mockData'
import { cn } from '@/lib/utils'
import { Employee } from './EmployeeDetails'

interface EmployeeTableProps {
    employees: Employee[]
    selectedId?: string
    onSelectEmployee?: (employee: Employee) => void
}

export default function EmployeeTable({ employees, selectedId, onSelectEmployee }: EmployeeTableProps) {
    const handleClick = (emp: Employee) => {
        onSelectEmployee?.(emp)
    }

    return (
        <div className="flex flex-col h-full bg-surface font-sans" dir="rtl">
            {/* Table Header Row - CLICK Branded */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-secondary text-white text-xs font-medium uppercase tracking-wider shadow-sm z-10">
                <div className="px-6 py-4">מספר עובד</div>
                <div className="px-6 py-4">שם משפחה</div>
                <div className="px-6 py-4">שם פרטי</div>
                <div className="px-6 py-4">תפקיד</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableBody>
                        {employees.map((emp, index) => (
                            <TableRow
                                key={emp.id}
                                onClick={() => handleClick(emp)}
                                className={cn(
                                    "grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-gray-100 cursor-pointer transition-all h-14 items-center hover:bg-gray-50",
                                    selectedId === emp.id
                                        ? "bg-primary/5 border-r-4 border-r-primary"
                                        : "border-r-4 border-r-transparent"
                                )}
                            >
                                <TableCell className="px-6 font-medium text-gray-900 text-sm">
                                    {emp.employeeNumber || emp.id}
                                </TableCell>
                                <TableCell className="px-6 text-gray-700 text-sm">
                                    {emp.lastName}
                                </TableCell>
                                <TableCell className="px-6 text-gray-700 text-sm">{emp.firstName}</TableCell>
                                <TableCell className="px-6 text-gray-500 text-sm">{emp.position}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer Stats - CLICK Style */}
            <div className="p-4 border-t border-border bg-gray-50/50 flex items-center justify-between text-xs font-medium text-text-secondary uppercase tracking-wider">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="opacity-60">מספר עובדים:</span>
                        <span className="text-primary font-bold">{employees.length}</span>
                    </div>
                    {selectedId && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="opacity-60">נבחר:</span>
                            <span className="text-primary font-bold">{employees.find(e => e.id === selectedId)?.employeeNumber || selectedId}</span>
                        </div>
                    )}
                </div>
                <div className="text-[10px] opacity-40">
                    CLICK CORE • HR DATABASE
                </div>
            </div>
        </div>
    )
}
