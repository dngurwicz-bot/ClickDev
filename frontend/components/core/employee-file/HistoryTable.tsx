'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/api'
import { format } from 'date-fns'
import {
    Printer, FileSpreadsheet, Filter, RefreshCw,
    FileText, MoreHorizontal, History
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColumnDef {
    key: string
    label: string
    format?: (value: any) => string
}

interface HistoryTableProps {
    employeeId: string
    columns: ColumnDef[]
    title?: string // e.g. "כתובת"
    eventCode?: string // e.g. "218"
    onAddClick?: () => void
    isEditing?: boolean
    onRowClick?: (record: any) => void
    showValidity?: boolean
    dataSource?: string // Custom endpoint path, e.g. `/api/employees/${id}/address`
}

export function HistoryTable({ employeeId, columns, title, eventCode, onAddClick, isEditing, onRowClick, showValidity = true, dataSource }: HistoryTableProps) {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showExpired, setShowExpired] = useState(false)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                let endpoint: string
                
                // Use custom dataSource if provided
                if (dataSource) {
                    endpoint = dataSource
                } else if (eventCode) {
                    // Use new event-specific API if event code is provided
                    // GET /api/employees/{id}/events?event_code=101&include_history=false
                    endpoint = `/api/employees/${employeeId}/events?event_code=${eventCode}&include_history=false`
                } else {
                    // Fallback to old history endpoint for compatibility
                    endpoint = `/api/employees/${employeeId}/history`
                }
                
                const response = await authFetch(endpoint)
                if (response.ok) {
                    const data = await response.json()
                    
                    // Handle both old format (array) and new format (object with event codes as keys)
                    if (Array.isArray(data)) {
                        setHistory(data)
                    } else if (eventCode && data[eventCode]) {
                        setHistory(data[eventCode])
                    } else {
                        setHistory(Array.isArray(data) ? data : [])
                    }
                }
            } catch (error) {
                console.error('Error fetching history:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [employeeId, dataSource, eventCode])

    if (loading) return <div className="p-4 text-xs text-gray-500 italic">טוען נתונים...</div>

    return (
        <div className="flex flex-col border border-gray-400 bg-white" dir="rtl">
            {/* Ultra-Dense Hilan Toolbar */}
            <div className="h-8 bg-[#f0f0f0] border-b border-gray-400 flex items-center px-1 justify-between select-none">
                <div className="flex items-center gap-0.5">
                    <ToolbarButton icon={<Printer className="w-3.5 h-3.5" />} title="הדפסה" />
                    <ToolbarButton icon={<FileSpreadsheet className="w-3.5 h-3.5 text-green-700" />} title="ייצוא לאקסל" />
                    <ToolbarButton icon={<FileText className="w-3.5 h-3.5 text-blue-700" />} title="ייצוא לוורד" />
                    <div className="w-px h-5 bg-gray-400 mx-1" />
                    <ToolbarButton icon={<RefreshCw className="w-3.5 h-3.5" />} title="רענון" />
                    <ToolbarButton icon={<Filter className="w-3.5 h-3.5" />} title="סינון" />

                    {onAddClick && (
                        <>
                            <div className="w-px h-5 bg-gray-400 mx-1" />
                            <button
                                onClick={onAddClick}
                                className={cn(
                                    "flex items-center gap-1 px-2 h-6 text-xs font-bold rounded shadow-sm transition-all",
                                    isEditing
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                )}
                            >
                                <MoreHorizontal className="w-3 h-3" />
                                {isEditing ? 'סגור עריכה' : 'עדכון פרטים'}
                            </button>
                        </>
                    )}

                    {/* View History Toggle Button */}
                    <div className="w-px h-5 bg-gray-400 mx-1" />
                    <button
                        onClick={() => setShowExpired(!showExpired)}
                        title={showExpired ? "הסתר רשומות שפקעו" : "הצג היסטוריה"}
                        className={cn(
                            "flex items-center gap-1 px-2 h-6 text-xs font-bold rounded shadow-sm transition-all",
                            showExpired
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-500 text-white hover:bg-gray-600"
                        )}
                    >
                        <History className="w-3 h-3" />
                    </button>

                    <div className="w-px h-5 bg-gray-400 mx-1" />

                    {/* Date Filters Mockup - Matching Screenshot */}
                    <div className="flex items-center gap-1 text-xs px-2 text-gray-700 font-sans">
                        <span>לפי תאריכים</span>
                        <div className="flex items-center gap-0.5 bg-white border border-gray-400 px-1 h-5 shadow-inner">
                            <span className="text-blue-700 font-bold">מ-</span>
                            <input className="w-14 border-none outline-none p-0 text-[11px] bg-transparent" defaultValue="07/2017" readOnly />
                        </div>
                        <div className="flex items-center gap-0.5 bg-white border border-gray-400 px-1 h-5 shadow-inner">
                            <span className="text-blue-700 font-bold">עד</span>
                            <input className="w-14 border-none outline-none p-0 text-[10px] bg-transparent" defaultValue="02/2026" readOnly />
                        </div>
                    </div>
                </div>

                <div className="flex items-center font-bold text-sm text-gray-800 pr-4 leading-none">
                    {eventCode && <span className="ml-1 tracking-tight">{eventCode} -</span>}
                    <span className="font-sans">{title || 'היסטוריה'}</span>
                </div>
            </div>

            {/* Dense Data Grid */}
            <div className="overflow-auto max-h-[400px] border-t border-white">
                <table className="w-full border-collapse table-fixed">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[#c6d7e7] border-b border-gray-400">
                            {showValidity && (
                                <>
                                    <th className="border-l border-gray-400 p-0.5 text-sm font-bold text-center w-24 text-gray-800">תאריך תוקף</th>
                                    <th className="border-l border-gray-400 p-0.5 text-sm font-bold text-center w-24 text-gray-800">גמר תוקף</th>
                                </>
                            )}
                            {columns.map((col) => (
                                <th key={col.key} className="border-l border-gray-400 p-0.5 text-sm font-bold text-center text-gray-800">
                                    {col.label}
                                </th>
                            ))}
                            <th className="p-0.5 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {(() => {
                            // Filter by validity status
                            const filteredHistory = showExpired 
                                ? history 
                                : history.filter(record => !record.valid_to)
                            
                            return filteredHistory.length > 0 ? (
                                filteredHistory.map((record, idx) => (
                                    <tr key={record.id || idx}
                                        onClick={() => onRowClick && onRowClick(record)}
                                        className={cn(
                                            "hover:bg-[#ebf4ff] border-b border-gray-200 transition-colors cursor-pointer",
                                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                                        )}>
                                        {showValidity && (
                                            <>
                                                <td className="border-l border-gray-200 p-0.5 text-sm text-center font-bold text-blue-800 tabular-nums">
                                                    {record.valid_from ? format(new Date(record.valid_from), 'dd/MM/yyyy') : '-'}
                                                </td>
                                                <td className="border-l border-gray-200 p-0.5 text-sm text-center text-gray-600 tabular-nums">
                                                    {record.valid_to ? format(new Date(record.valid_to), 'dd/MM/yyyy') : '-'}
                                                </td>
                                            </>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key} className="border-l border-gray-200 p-0.5 text-sm px-2 truncate text-gray-700">
                                                {col.format ? col.format(record[col.key]) : (record[col.key] ?? '')}
                                            </td>
                                        ))}
                                        <td className="p-0.5 text-center">
                                            <MoreHorizontal className="w-3 h-3 text-gray-400 mx-auto cursor-pointer hover:text-blue-600" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 3} className="p-4 text-center text-xs text-gray-400 italic">
                                        {showExpired ? 'אין נתונים היסטוריים להצגה' : 'אין רשומות פעילות'}
                                    </td>
                                </tr>
                            )
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function ToolbarButton({ icon, title, onClick }: { icon: React.ReactNode; title?: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-1 hover:bg-gray-300 active:bg-gray-400 rounded-sm transition-colors border border-transparent hover:border-gray-500 flex items-center justify-center"
        >
            {icon}
        </button>
    )
}
