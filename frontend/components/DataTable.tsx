'use client'

import { useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender,
    FilterFn,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Search, X, Filter } from 'lucide-react'
import { FacetedFilter } from './FacetedFilter'

interface DataTableProps<TData> {
    columns: ColumnDef<TData>[]
    data: TData[]
    onRowClick?: (row: TData) => void
    showSearch?: boolean
}

export default function DataTable<TData>({
    columns,
    data,
    onRowClick,
    showSearch = true
}: DataTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnFilters, setColumnFilters] = useState<any[]>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedUniqueValues: (table, columnId) => () => {
            const map = new Map()
            table.getPreFilteredRowModel().flatRows.forEach(row => {
                const value = row.getValue(columnId)
                if (value !== undefined && value !== null) {
                    map.set(value, (map.get(value) || 0) + 1)
                }
            })
            return map
        },
        state: {
            globalFilter,
            columnFilters,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        initialState: {
            pagination: {
                pageSize: 50, // More rows per page for ERP feel
            },
        },
    })

    return (
        <div className="space-y-3 font-sans" dir="rtl">
            {/* Toolbar - Compact & Professional */}
            <div className="flex items-center justify-between gap-4 bg-white p-2 border border-gray-300 shadow-sm rounded-sm">
                {/* Global Search - Compact */}
                {showSearch && (
                    <div className="relative max-w-sm w-full">
                        <input
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="חיפוש מהיר..."
                            className="w-full h-8 pl-8 pr-2 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm outline-none transition-all placeholder:text-gray-400"
                        />
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        {globalFilter && (
                            <button
                                onClick={() => setGlobalFilter('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination Stats - Compact */}
                <div className="text-xs text-gray-600 font-medium">
                    סה"כ: <span className="font-bold text-gray-900">{table.getFilteredRowModel().rows.length}</span> רשומות
                </div>
            </div>

            {/* Table Container - ERP Style */}
            <div className="border-[1.5px] border-gray-400 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                        {/* Header - ERP Style: Light blue-gray, Bold, Crisp Borders */}
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="bg-[#e2e8f0] border-b-[1.5px] border-gray-400">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-2 py-1 text-right text-[12px] font-bold text-gray-800 border-l border-gray-300 last:border-l-0 select-none relative group h-8"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        >
                                            <div
                                                className={`flex items-center justify-between gap-1 ${header.column.getCanSort() ? 'cursor-pointer hover:text-blue-700' : ''}`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <span className="truncate">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {header.column.getCanSort() && (
                                                    <div className="w-3 shrink-0 opacity-50 group-hover:opacity-100 italic font-medium text-[10px]">
                                                        {header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        {/* Body - Compact, Crisp Grids */}
                        <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-8 text-center text-gray-500 bg-gray-50"
                                    >
                                        לא נמצאו נתונים תואמים
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={`
                                            border-b border-gray-300 last:border-b-0 transition-colors h-7
                                            ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'} 
                                            ${onRowClick ? 'hover:bg-blue-50 cursor-pointer' : ''}
                                        `}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-2 py-0 border-l border-gray-200 last:border-l-0 truncate align-middle h-7"
                                                style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                                                title={cell.getValue() as string}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer - ERP Style */}
                <div className="bg-gray-100 border-t border-gray-300 px-2 py-1.5 flex items-center justify-between select-none">
                    <div className="flex gap-1">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-2 py-0.5 border border-gray-300 bg-white rounded-sm text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            הקודם
                        </button>
                        <div className="flex items-center gap-1 px-2 text-xs text-gray-600 bg-white border border-gray-300 rounded-sm shadow-sm">
                            עמוד <span className="font-bold text-gray-900">{table.getState().pagination.pageIndex + 1}</span> מתוך <span className="font-bold text-gray-900">{table.getPageCount()}</span>
                        </div>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-2 py-0.5 border border-gray-300 bg-white rounded-sm text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            הבא
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
