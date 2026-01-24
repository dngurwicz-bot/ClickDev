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
            <div className="border border-gray-400 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        {/* Header - ERP Style: Gradient/Solid, Bold, Borders */}
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="bg-gradient-to-b from-gray-100 to-gray-200 border-b border-gray-400">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-2 py-1.5 min-w-[120px] text-right text-xs font-bold text-gray-800 border-l border-gray-300 last:border-l-0 select-none relative group"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {/* Header Content */}
                                                <div
                                                    className={`flex items-center justify-between gap-1 px-1 ${header.column.getCanSort() ? 'cursor-pointer hover:text-blue-700' : ''}`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <span className="truncate" title={header.column.columnDef.header as string}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </span>
                                                    {header.column.getCanSort() && (
                                                        <div className="w-3 flex flex-col items-center opacity-50 group-hover:opacity-100">
                                                            {header.column.getIsSorted() === 'asc' ? (
                                                                <ChevronUp className="w-3 h-3 text-blue-600" />
                                                            ) : header.column.getIsSorted() === 'desc' ? (
                                                                <ChevronDown className="w-3 h-3 text-blue-600" />
                                                            ) : (
                                                                <div className="flex flex-col -space-y-1">
                                                                    <ChevronUp className="w-2 h-2 text-gray-400" />
                                                                    <ChevronDown className="w-2 h-2 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Filter Input - Directly inside header for ERP feel */}
                                                {header.column.getCanFilter() && (
                                                    <div className="mt-0.5 px-0.5" onClick={(e) => e.stopPropagation()}>
                                                        {(header.column.columnDef.meta as any)?.filterVariant === 'select' ? (
                                                            <div className="h-6">
                                                                <FacetedFilter
                                                                    column={header.column}
                                                                    title="הכל"
                                                                    options={(header.column.columnDef.meta as any)?.filterOptions}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <input
                                                                    value={(header.column.getFilterValue() as string) ?? ''}
                                                                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                                                                    className="w-full h-6 px-1.5 text-xs border border-gray-300 rounded-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none bg-white"
                                                                    placeholder=""
                                                                />
                                                                {!header.column.getFilterValue() && (
                                                                    <Filter className="absolute left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-300 pointer-events-none" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Resizer handle visual - optional enhancement */}
                                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gray-300 cursor-col-resize opacity-0 group-hover:opacity-100" />
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        {/* Body - Compact, Striped, Borders */}
                        <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-8 text-center text-gray-500 text-sm bg-gray-50"
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
                                            border-b border-gray-200 last:border-b-0 transition-colors
                                            ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} 
                                            ${onRowClick ? 'hover:bg-blue-50 cursor-pointer' : ''}
                                        `}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-2 py-1.5 text-xs text-gray-700 border-l border-gray-200 last:border-l-0 truncate max-w-[200px]"
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
