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
    showSearch = true,
    enableDateFilter = false // Default to false to prevent crashing on lists without dates
}: DataTableProps<TData> & { enableDateFilter?: boolean }) {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnFilters, setColumnFilters] = useState<any[]>([])

    // Default to current month
    const [fromDate, setFromDate] = useState<string>(() => {
        const d = new Date()
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`
    })
    const [toDate, setToDate] = useState<string>(() => {
        const d = new Date()
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${lastDay}`
    })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        filterFns: {
            // Only used if enabled
            dateRange: (row, columnId, filterValue) => {
                if (!enableDateFilter) return true
                const { from, to } = filterValue
                try {
                    const rowEffective = row.getValue('effective_date') as string
                    const rowExpiry = row.getValue('expiry_date') as string | null
                    if (!rowEffective) return true

                    const rowStart = rowEffective
                    const rowEnd = rowExpiry || '9999-12-31'
                    const filterStart = from || '0001-01-01'
                    const filterEnd = to || '9999-12-31'

                    return rowStart <= filterEnd && rowEnd >= filterStart
                } catch (e) {
                    return true
                }
            }
        },
        state: {
            globalFilter,
            columnFilters,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        initialState: {
            pagination: { pageSize: 50 },
        },
    })

    // Apply date range filter manually only if enabled
    const filteredData = table.getRowModel().rows.filter(row => {
        if (!enableDateFilter) return true
        if (!fromDate && !toDate) return true

        try {
            // Check if column exists before access to avoid crashing
            const effectiveCol = row.getAllCells().find(c => c.column.id === 'effective_date')
            if (!effectiveCol) return true

            const rowEffective = effectiveCol.getValue() as string
            const rowExpiry = row.getValue('expiry_date') as string | null

            if (!rowEffective) return true

            const rowStart = rowEffective
            const rowEnd = rowExpiry || '9999-12-31'

            const filterStart = fromDate || '0001-01-01'
            const filterEnd = toDate || '9999-12-31'

            return rowStart <= filterEnd && rowEnd >= filterStart
        } catch (e) {
            return true
        }
    })

    return (
        <div className="space-y-3 font-sans" dir="rtl">
            {/* Hilan-Style Toolbar - Ultra-Dense */}
            <div className="h-8 bg-[#f0f0f0] border border-gray-400 flex items-center px-1 justify-between select-none shadow-sm">
                <div className="flex items-center gap-0.5">
                    {showSearch && (
                        <div className="relative h-6">
                            <input
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                placeholder="חיפוש..."
                                className="h-6 pl-6 pr-2 text-[11px] border border-gray-400 outline-none focus:border-blue-500 bg-white"
                                style={{ width: '150px' }}
                            />
                            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                            {globalFilter && (
                                <button
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="w-px h-5 bg-gray-400 mx-0.5" />

                    {/* Hilan Date Range Filter */}
                    {enableDateFilter && (
                        <>
                            <span className="text-[10px] text-gray-700 font-bold px-1">תאריכים:</span>
                            <div className="flex items-center gap-0.5 bg-white border border-gray-400 px-1 h-6 shadow-inner">
                                <span className="text-blue-700 font-bold text-[9px]">מ-</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="border-none outline-none p-0 text-[10px] bg-transparent w-24"
                                />
                            </div>
                            <div className="flex items-center gap-0.5 bg-white border border-gray-400 px-1 h-6 shadow-inner">
                                <span className="text-blue-700 font-bold text-[9px]">עד</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="border-none outline-none p-0 text-[10px] bg-transparent w-24"
                                />
                            </div>
                        </>
                    )}

                    <div className="w-px h-5 bg-gray-400 mx-0.5" />
                </div>

                {/* Right side stats */}
                <div className="text-[10px] text-gray-700 font-bold px-1">
                    סה"כ: {filteredData.length}
                </div>
            </div>

            {/* Table Container - Hilan/ERP Style */}
            <div className="border-[1px] border-gray-400 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                    <table className="w-full border-collapse text-[12px]">
                        {/* Header - Hilan Style */}
                        <thead className="sticky top-0">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="bg-[#c0c0c0] border-b border-gray-400">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-1 py-1 text-right text-[11px] font-bold text-black border-l border-gray-400 last:border-l-0 select-none relative group bg-[#c0c0c0] h-6"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        >
                                            <div
                                                className={`flex items-center justify-between gap-1 h-full ${header.column.getCanSort() ? 'cursor-pointer hover:bg-[#a0a0a0]' : ''}`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <span className="truncate font-sans">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {header.column.getCanSort() && (
                                                    <div className="text-[9px] shrink-0 opacity-60 group-hover:opacity-100 font-bold">
                                                        {header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        {/* Body - Hilan Dense Grid */}
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-2 py-4 text-center text-gray-500 bg-white text-[11px]"
                                    >
                                        לא נמצאו נתונים תואמים
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={`
                                            border-b border-gray-300 last:border-b-0 transition-colors h-6
                                            ${i % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'} 
                                            ${onRowClick ? 'hover:bg-[#e0f0f0] cursor-pointer' : ''}
                                        `}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-1 py-0 border-l border-gray-300 last:border-l-0 truncate align-middle text-[11px] h-6"
                                                style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                                                title={String(cell.getValue() ?? '')}
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

                {/* Hilan-Style Pagination Footer */}
                <div className="bg-[#f0f0f0] border-t border-gray-400 px-1 py-1 flex items-center justify-between select-none h-7">
                    <div className="flex gap-0.5 items-center">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-2 py-0.5 border border-gray-400 bg-[#e0e0e0] text-[10px] font-bold text-black hover:bg-[#d0d0d0] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            &lt;&lt; הקודם
                        </button>
                        <div className="flex items-center gap-1 px-1 text-[10px] text-black bg-white border border-gray-400 shadow-sm">
                            <span className="font-bold">{table.getState().pagination.pageIndex + 1}</span>
                            <span>/</span>
                            <span className="font-bold">{table.getPageCount()}</span>
                        </div>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-2 py-0.5 border border-gray-400 bg-[#e0e0e0] text-[10px] font-bold text-black hover:bg-[#d0d0d0] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            הבא &gt;&gt;
                        </button>
                    </div>
                    <span className="text-[10px] text-gray-700 font-bold">
                        סה"כ: <span className="font-bold">{filteredData.length}</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
