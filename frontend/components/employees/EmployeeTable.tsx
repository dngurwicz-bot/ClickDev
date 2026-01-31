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
        <div className="flex flex-col h-full bg-white font-sans" dir="rtl">
            {/* Table Header Row - CLICK Branded */}
            {/* Table Header Row - CLICK Branded */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-secondary text-white text-[12px] font-black uppercase tracking-wider shadow-md z-10">
                <div className="px-4 py-3 border-l border-white/10 opacity-70">מספר עובד</div>
                <div className="px-4 py-3 border-l border-white/10">שם משפחה</div>
                <div className="px-4 py-3 border-l border-white/10">שם פרטי</div>
                <div className="px-4 py-3 opacity-70">תפקיד</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
                <Table variant="hilan">
                    <TableBody>
                        {employees.map((emp, index) => (
                            <TableRow
                                key={emp.id}
                                variant="hilan"
                                onClick={() => handleClick(emp)}
                                className={cn(
                                    "grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-gray-100 cursor-pointer transition-all h-12 items-center",
                                    selectedId === emp.id
                                        ? "bg-primary/10 border-r-4 border-r-primary shadow-inner"
                                        : "hover:bg-primary/5 group"
                                )}
                            >
                                <TableCell variant="hilan" className="font-bold tracking-wider text-black text-sm">
                                    {emp.employeeNumber || emp.id}
                                </TableCell>
                                <TableCell variant="hilan" className="font-bold text-black text-sm">
                                    {emp.lastName}
                                </TableCell>
                                <TableCell variant="hilan" className="font-bold text-black text-sm">{emp.firstName}</TableCell>
                                <TableCell variant="hilan" className="font-bold text-black text-sm">{emp.position}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer Stats - CLICK Style */}
            <div className="p-3 px-6 border-t bg-gray-50 flex items-center justify-between text-[11px] font-black text-secondary uppercase tracking-widest">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="opacity-40">מספר עובדים:</span>
                        <span className="text-primary">{employees.length}</span>
                    </div>
                    {selectedId && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="opacity-40">נבחר:</span>
                            <span className="text-primary">{employees.find(e => e.id === selectedId)?.employeeNumber || selectedId}</span>
                        </div>
                    )}
                </div>
                <div className="text-[10px] opacity-30">
                    CLICK CORE • HR DATABASE
                </div>
            </div>
        </div>
    )
}
