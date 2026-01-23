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
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
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
                pageSize: 20,
            },
        },
    })

    return (
        <div className="space-y-4">
            {/* Global Search */}
            {showSearch && (
                <div className="relative">
                    <input
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="חיפוש בכל השדות..."
                        className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {globalFilter && (
                        <button
                            onClick={() => setGlobalFilter('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div className="space-y-2">
                                                    {/* Column Header with Sort */}
                                                    <div
                                                        className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                                                            }`}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                        {header.column.getCanSort() && (
                                                            <span className="text-gray-400">
                                                                {header.column.getIsSorted() === 'asc' ? (
                                                                    <ChevronUp className="w-4 h-4" />
                                                                ) : header.column.getIsSorted() === 'desc' ? (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                ) : (
                                                                    <div className="w-4 h-4 flex flex-col">
                                                                        <ChevronUp className="w-3 h-3 -mb-1" />
                                                                        <ChevronDown className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Column Filter */}
                                                    {header.column.getCanFilter() && (
                                                        <>
                                                            {(header.column.columnDef.meta as any)?.filterVariant === 'select' ? (
                                                                <FacetedFilter
                                                                    column={header.column}
                                                                    title="בחר..."
                                                                    options={(header.column.columnDef.meta as any)?.filterOptions}
                                                                />
                                                            ) : (
                                                                <input
                                                                    value={(header.column.getFilterValue() as string) ?? ''}
                                                                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                                                                    placeholder="סנן..."
                                                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        לא נמצאו תוצאות
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 text-sm">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-700">
                        מציג {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} עד{' '}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}{' '}
                        מתוך {table.getFilteredRowModel().rows.length} תוצאות
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            הקודם
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            הבא
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
