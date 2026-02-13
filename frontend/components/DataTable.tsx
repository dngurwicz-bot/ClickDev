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
} from '@tanstack/react-table'
import { Search, X } from 'lucide-react'

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
            <div className="min-h-10 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {showSearch && (
                        <div className="relative h-8">
                            <input
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                placeholder="חיפוש..."
                                className="h-8 w-52 pl-8 pr-8 text-xs click-ui-input bg-white"
                            />
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ui-text-soft)]" />
                            {globalFilter && (
                                <button
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--ui-text-soft)] hover:text-[var(--ui-text)] p-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {enableDateFilter && (
                        <>
                            <span className="text-xs text-[var(--ui-text-soft)] font-medium">טווח תאריכים:</span>
                            <div className="flex items-center gap-1 bg-white border border-[var(--ui-border)] px-2 h-8 rounded-md">
                                <span className="text-[var(--ui-accent)] font-semibold text-[11px]">מ-</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="border-none outline-none p-0 text-xs bg-transparent w-28"
                                />
                            </div>
                            <div className="flex items-center gap-1 bg-white border border-[var(--ui-border)] px-2 h-8 rounded-md">
                                <span className="text-[var(--ui-accent)] font-semibold text-[11px]">עד</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="border-none outline-none p-0 text-xs bg-transparent w-28"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="text-xs font-semibold text-[var(--ui-text)] bg-white border border-[var(--ui-border)] px-2 py-1 rounded-full">
                    סה"כ: {filteredData.length}
                </div>
            </div>

            <div className="click-ui-table-shell shadow-sm">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                    <table className="w-full border-collapse text-xs">
                        <thead className="sticky top-0">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="click-ui-table-head border-b border-[var(--ui-border-strong)]">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-3 py-2 text-right text-[11px] font-bold text-[var(--ui-text)] border-l border-[var(--ui-border-strong)] last:border-l-0 select-none relative group h-9"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                        >
                                            <div
                                                className={`flex items-center justify-between gap-1 h-full ${header.column.getCanSort() ? 'cursor-pointer hover:text-[var(--ui-accent)]' : ''}`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <span className="truncate font-sans">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {header.column.getCanSort() && (
                                                    <div className="text-[10px] shrink-0 opacity-60 group-hover:opacity-100 font-bold">
                                                        {header.column.getIsSorted() === 'asc' ? '↑' : header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-2 py-12 text-center text-slate-500 bg-white text-sm"
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
                                            border-b border-[var(--ui-border)] last:border-b-0 transition-colors h-10
                                            ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fbfd]'} 
                                            ${onRowClick ? 'hover:bg-[#f1f7fb] cursor-pointer' : ''}
                                        `}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-3 py-1 border-l border-[var(--ui-border)] last:border-l-0 truncate align-middle text-xs text-[var(--ui-text)] h-10"
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

                <div className="bg-[var(--ui-surface-soft)] border-t border-[var(--ui-border)] px-3 py-2 flex items-center justify-between select-none">
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-2 py-1 border border-[var(--ui-border)] bg-white text-[11px] font-semibold text-[var(--ui-text)] rounded-md hover:border-[var(--ui-accent)] hover:text-[var(--ui-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &lt;&lt; הקודם
                        </button>
                        <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--ui-text)] bg-white border border-[var(--ui-border)] rounded-md">
                            <span className="font-semibold">{table.getState().pagination.pageIndex + 1}</span>
                            <span>/</span>
                            <span className="font-semibold">{table.getPageCount()}</span>
                        </div>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-2 py-1 border border-[var(--ui-border)] bg-white text-[11px] font-semibold text-[var(--ui-text)] rounded-md hover:border-[var(--ui-accent)] hover:text-[var(--ui-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            הבא &gt;&gt;
                        </button>
                    </div>
                    <span className="text-[11px] text-[var(--ui-text-soft)] font-medium">
                        סה"כ: <span className="font-semibold text-[var(--ui-text)]">{filteredData.length}</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
