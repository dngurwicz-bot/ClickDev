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
            <div className="shrink-0 px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                        תצוגת רשימה דינמית: סנן בכל עמודה כדי להתמקד מהר.
                    </p>
                    <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {data.length} רשומות
                    </span>
                </div>
            </div>
            {/* Column Headers */}
            <div className="overflow-x-auto shrink-0 border-b border-slate-300">
                <table className="w-full border-collapse min-w-max">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                            {columns.map((col, idx) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "px-3 py-2 text-right text-[11px] font-bold text-slate-700 border-l border-slate-300 whitespace-nowrap select-none",
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
                        <tr className="bg-white border-b border-slate-200">
                            {columns.map((col, idx) => (
                                <td
                                    key={`filter-${col.key}`}
                                    className={cn(
                                        "px-1 py-1 border-l border-slate-100",
                                        idx === columns.length - 1 && "border-l-0"
                                    )}
                                >
                                    <input
                                        type="text"
                                        placeholder="סינון..."
                                        className="w-full h-7 px-2 text-xs border border-slate-200 bg-slate-50 rounded-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
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
                        <div className="text-center text-slate-500">
                            <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
                            <span className="text-sm">טוען נתונים...</span>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-lg bg-slate-50 border border-slate-200 rounded-xl p-8">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Search className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{emptyMessage}</h3>
                            <p className="text-sm text-slate-600 mb-2">{emptySubMessage}</p>
                            <p className="text-sm text-slate-600 mb-6">אפשר להתחיל מסינון, או להוסיף עובד חדש.</p>

                            <div className="flex items-center justify-center gap-3">
                                {onAddNew && (
                                    <button
                                        onClick={onAddNew}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold text-sm hover:bg-emerald-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>הוספת עובד</span>
                                    </button>
                                )}

                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors">
                                    <Search className="w-3.5 h-3.5" />
                                    <span>חיפוש חכם</span>
                                </button>
                            </div>

                            <div className="mt-5 text-xs text-slate-500">
                                טיפ: הקלד חלק ממספר עובד/ת.ז בשורת הסינון העליונה.
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
                                        "cursor-pointer transition-colors border-b border-slate-100 h-9",
                                        selectedId === row.id
                                            ? "bg-emerald-50 border-emerald-200"
                                            : rowIdx % 2 === 0
                                                ? "bg-white hover:bg-slate-50"
                                                : "bg-slate-50/40 hover:bg-slate-50"
                                    )}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={`${row.id}-${col.key}`}
                                            className={cn(
                                                "px-3 py-1 text-xs text-slate-700 border-l border-slate-100 truncate",
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
