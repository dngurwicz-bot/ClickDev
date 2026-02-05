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
        <div className="overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full text-xs text-right border-collapse font-sans">
                <thead className="bg-[#EAECEE] text-gray-700 font-bold sticky top-0">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="p-1 px-2 border-l border-b border-white last:border-l-0 whitespace-nowrap"
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
                            <td colSpan={columns.length} className="p-4 text-center text-gray-400">
                                טוען נתונים...
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="p-4 text-center text-gray-400">
                                אין נתונים להצגה
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className={cn(
                                    "hover:bg-[#EBF5FB] cursor-pointer transition-colors odd:bg-white even:bg-[#F8F9F9]",
                                    // Optional: Selected row styling if needed
                                )}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={`${String(row.id)}-${col.key}`}
                                        className="p-1 px-2 border-b border-gray-200 border-l border-l-gray-100 last:border-l-0 text-gray-800 truncate max-w-[200px]"
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
