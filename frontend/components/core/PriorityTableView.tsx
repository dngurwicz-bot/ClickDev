'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'

export interface TableColumn {
    key: string
    header: string
    width?: string
    required?: boolean
    render?: (value: any, row: any) => React.ReactNode
}

interface PriorityTableViewProps<T extends { id: string | number }> {
    columns: TableColumn[]
    data: T[]
    selectedId?: string | number | null
    onRowClick?: (row: T) => void
    onRowDoubleClick?: (row: T) => void
    onAddNew?: () => void
    isLoading?: boolean
    emptyMessage?: string
    emptySubMessage?: string
    filterRow?: Record<string, string>
    onFilterChange?: (key: string, value: string) => void
}

export function PriorityTableView<T extends { id: string | number }>({
    columns,
    data,
    selectedId,
    onRowClick,
    onRowDoubleClick,
    onAddNew,
    isLoading,
    emptyMessage = 'הרשימה שלך ריקה',
    emptySubMessage = 'להצגת נתונים אפשר להשתמש בפילטרים של העמודות.',
    filterRow,
    onFilterChange,
}: PriorityTableViewProps<T>) {
    return (
        <div className="flex flex-col h-full bg-white font-sans" dir="rtl">
            {/* Column Headers */}
            <div className="overflow-x-auto shrink-0 border-b border-[#BDC3C7]">
                <table className="w-full border-collapse min-w-max">
                    <thead>
                        <tr className="bg-[#F0F3F4] border-b border-[#BDC3C7]">
                            {columns.map((col, idx) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "px-3 py-2 text-right text-[11px] font-bold text-[#2C3E50] border-l border-[#D5DBDB] whitespace-nowrap select-none",
                                        idx === columns.length - 1 && "border-l-0"
                                    )}
                                    style={{ width: col.width, minWidth: col.width || '120px' }}
                                >
                                    <span className="flex items-center gap-1">
                                        {col.required && <span className="text-red-500">*</span>}
                                        {col.header}
                                    </span>
                                </th>
                            ))}
                        </tr>
                        {/* Filter Row */}
                        <tr className="bg-white border-b border-[#D5DBDB]">
                            {columns.map((col, idx) => (
                                <td
                                    key={`filter-${col.key}`}
                                    className={cn(
                                        "px-1 py-0.5 border-l border-[#E8EAEB]",
                                        idx === columns.length - 1 && "border-l-0"
                                    )}
                                >
                                    <input
                                        type="text"
                                        className="w-full h-6 px-1 text-xs border border-[#D5DBDB] bg-white focus:border-[#2980B9] focus:outline-none"
                                        value={filterRow?.[col.key] || ''}
                                        onChange={(e) => onFilterChange?.(col.key, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-[#7F8C8D]">
                            <div className="animate-spin w-8 h-8 border-2 border-[#2980B9] border-t-transparent rounded-full mx-auto mb-3" />
                            <span className="text-sm">טוען נתונים...</span>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                            {/* Empty state illustration */}
                            <div className="w-32 h-32 mx-auto mb-6 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-24 bg-[#E8EAEB] rounded-sm relative">
                                        <div className="absolute top-2 right-2 left-2 space-y-1.5">
                                            <div className="h-1 bg-[#BDC3C7] rounded-full w-3/4" />
                                            <div className="h-1 bg-[#BDC3C7] rounded-full w-full" />
                                            <div className="h-1 bg-[#BDC3C7] rounded-full w-1/2" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1">
                                        <div className="w-10 h-10 bg-[#7C3AED] rounded-full flex items-center justify-center shadow-md">
                                            <Plus className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#2C3E50] mb-3">{emptyMessage}</h3>
                            <p className="text-sm text-[#7F8C8D] mb-2">{emptySubMessage}</p>
                            <p className="text-sm text-[#7F8C8D] mb-4">להוספת נתונים חדשים אפשר להשתמש בכפתור חדש.</p>

                            {onAddNew && (
                                <button
                                    onClick={onAddNew}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-white border-2 border-[#7C3AED] text-[#7C3AED] rounded-full font-bold text-sm hover:bg-[#7C3AED] hover:text-white transition-colors"
                                >
                                    <span>חדש</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}

                            <div className="mt-4">
                                <p className="text-sm text-[#7F8C8D] mb-2">אפשר לחפש גם בעזרת AI.</p>
                                <button className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-[#D5DBDB] rounded-full text-sm text-[#7F8C8D] hover:border-[#2980B9] hover:text-[#2980B9] transition-colors">
                                    <Search className="w-3.5 h-3.5" />
                                    <span>חיפוש עם aiERP</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <table className="w-full border-collapse min-w-max">
                        <tbody>
                            {data.map((row, rowIdx) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row)}
                                    onDoubleClick={() => onRowDoubleClick?.(row)}
                                    className={cn(
                                        "cursor-pointer transition-colors border-b border-[#F0F3F4] h-8",
                                        selectedId === row.id
                                            ? "bg-[#D6EAF8] border-[#2980B9]"
                                            : rowIdx % 2 === 0
                                                ? "bg-white hover:bg-[#EBF5FB]"
                                                : "bg-[#FAFBFC] hover:bg-[#EBF5FB]"
                                    )}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={`${row.id}-${col.key}`}
                                            className={cn(
                                                "px-3 py-1 text-xs text-[#2C3E50] border-l border-[#F0F3F4] truncate",
                                                colIdx === columns.length - 1 && "border-l-0"
                                            )}
                                            style={{ width: col.width, minWidth: col.width || '120px' }}
                                        >
                                            {col.render
                                                ? col.render((row as any)[col.key], row)
                                                : (row as any)[col.key] ?? ''
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
