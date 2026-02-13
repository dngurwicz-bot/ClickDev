'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
    key: string
    header: string
    render?: (row: T) => React.ReactNode
    width?: string
}

interface PriorityDataGridProps<T> {
    columns: Column<T>[]
    data: T[]
    onRowClick?: (row: T) => void
    isLoading?: boolean
}

export function PriorityDataGrid<T extends { id: string | number }>({ columns, data, onRowClick, isLoading }: PriorityDataGridProps<T>) {
    return (
        <div className="overflow-x-auto click-ui-table-shell shadow-sm">
            <table className="w-full text-xs text-right border-collapse font-sans">
                <thead className="click-ui-table-head font-bold sticky top-0">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-3 py-2 border-l border-b border-[var(--ui-border-strong)] last:border-l-0 whitespace-nowrap text-[11px]"
                                style={{ width: col.width }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {isLoading ? (
                        <tr>
                            <td colSpan={columns.length} className="p-4 text-center text-slate-500">
                                טוען נתונים...
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="p-4 text-center text-slate-500">
                                אין נתונים להצגה
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className={cn(
                                    "hover:bg-[#f1f7fb] cursor-pointer transition-colors odd:bg-white even:bg-[#f8fbfd] h-10",
                                )}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={`${String(row.id)}-${col.key}`}
                                        className="px-3 py-1 border-b border-[var(--ui-border)] border-l border-l-[var(--ui-border)] last:border-l-0 text-[var(--ui-text)] truncate max-w-[240px]"
                                    >
                                        {col.render ? col.render(row) : (row as any)[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
