'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Settings2, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Employee } from '@/components/employees/EmployeeDetails'

interface ClickSearchPopoverProps {
    onSelect: (employee: Employee) => void
    onAddNew: () => void
    onAdvancedSearch: () => void
    onClose?: () => void
    initialEmployees?: Employee[]
}

export function ClickSearchPopover({
    onSelect,
    onAddNew,
    onAdvancedSearch,
    initialEmployees = []
}: ClickSearchPopoverProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filtered, setFiltered] = useState<Employee[]>(initialEmployees)

    useEffect(() => {
        if (!searchTerm) {
            setFiltered(initialEmployees)
            return
        }
        const term = searchTerm.toLowerCase()
        setFiltered(initialEmployees.filter(e =>
            e.employeeNumber?.toLowerCase().includes(term) ||
            e.firstName.toLowerCase().includes(term) ||
            e.lastName.toLowerCase().includes(term)
        ))
    }, [searchTerm, initialEmployees])

    return (
        <div
            className="absolute top-12 right-0 z-[100] w-[420px] bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
        >
            {/* Header / Search Input */}
            <div className="p-4 bg-gradient-to-b from-white/50 to-transparent">
                <div className="relative group">
                    <input
                        autoFocus
                        type="text"
                        placeholder="חיפוש עובד..."
                        className="w-full h-11 pl-4 pr-11 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-3.5 top-3 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto px-2 pb-2 custom-scrollbar">
                {filtered.map((emp) => (
                    <div
                        key={emp.id}
                        onClick={() => onSelect(emp)}
                        className="flex items-center gap-3 p-3 hover:bg-primary/5 cursor-pointer rounded-xl group transition-all duration-200"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                            {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                    {emp.firstName} {emp.lastName}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded leading-none">
                                    #{emp.employeeNumber}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 truncate mt-0.5">
                                {emp.position || 'ללא תפקיד'} • {emp.department || 'ללא מחלקה'}
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <div className="p-3 bg-gray-50 rounded-full">
                            <Search className="w-6 h-6 opacity-20" />
                        </div>
                        <div className="text-sm font-medium">לא נמצאו תוצאות ל"{searchTerm}"</div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                    onClick={onAdvancedSearch}
                    className="flex-1 flex items-center justify-center gap-2 h-9 text-xs font-semibold text-gray-600 hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-primary/10"
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>חיפוש מתקדם</span>
                </button>
                <button
                    onClick={onAddNew}
                    className="flex-1 flex items-center justify-center gap-2 h-9 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>עובד חדש</span>
                </button>
            </div>
        </div>
    )
}
