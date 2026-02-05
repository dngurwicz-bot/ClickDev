'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, X, Edit2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EditableColumn<T> {
    key: keyof T | string
    header: string
    width?: string
    editable?: boolean
    type?: 'text' | 'date' | 'number' | 'select'
    options?: { label: string; value: string }[] // For select type
    render?: (row: T) => React.ReactNode
}

interface PriorityEditableDataGridProps<T> {
    columns: EditableColumn<T>[]
    data: T[]
    onRowUpdate?: (id: string, newData: T) => Promise<void> | void
    onRowAdd?: (newData: Partial<T>) => Promise<void> | void
    onRowDelete?: (id: string) => Promise<void> | void
    isLoading?: boolean
    newRowDefaults?: Partial<T>
}

export function PriorityEditableDataGrid<T extends { id: string }>({
    columns,
    data,
    onRowUpdate,
    onRowAdd,
    onRowDelete,
    isLoading,
    newRowDefaults
}: PriorityEditableDataGridProps<T>) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<Partial<T>>({})

    // New Row State
    const [isAdding, setIsAdding] = useState(false)
    const [newRowValues, setNewRowValues] = useState<Partial<T>>({})

    const handleEditClick = (row: T) => {
        setEditingId(row.id)
        setEditValues(row)
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditValues({})
    }

    const handleSaveEdit = async () => {
        if (!editingId || !onRowUpdate) return
        try {
            await onRowUpdate(editingId, editValues as T)
            setEditingId(null)
            setEditValues({})
        } catch (error) {
            console.error('Failed to save row', error)
        }
    }

    const handleChange = (key: string, value: any, isNewRow: boolean = false) => {
        if (isNewRow) {
            setNewRowValues(prev => ({ ...prev, [key]: value }))
        } else {
            setEditValues(prev => ({ ...prev, [key]: value }))
        }
    }

    const handleStartAdd = () => {
        setIsAdding(true)
        setNewRowValues(newRowDefaults || {})
    }

    const handleCancelAdd = () => {
        setIsAdding(false)
        setNewRowValues({})
    }

    const handleSaveAdd = async () => {
        if (!onRowAdd) return
        try {
            await onRowAdd(newRowValues)
            setIsAdding(false)
            setNewRowValues({})
        } catch (error) {
            console.error('Failed to add row', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!onRowDelete) return
        if (confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
            await onRowDelete(id)
        }
    }

    const renderInput = (col: EditableColumn<T>, value: any, isNewRow: boolean = false) => {
        const onChange = (e: any) => handleChange(col.key as string, e.target.value, isNewRow)

        if (col.type === 'select' && col.options) {
            return (
                <select
                    value={value || ''}
                    onChange={onChange}
                    className="w-full text-xs p-1 border border-primary rounded focus:outline-none"
                    autoFocus={!isNewRow}
                >
                    <option value="">בחר...</option>
                    {col.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )
        }

        return (
            <input
                type={col.type || 'text'}
                value={value || ''} // Handle nulls gracefully
                onChange={onChange}
                className="w-full text-xs p-1 border border-primary rounded focus:outline-none"
                autoFocus={!isNewRow && col.type !== 'date'}
            />
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {onRowAdd && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleStartAdd}
                        disabled={isAdding || !!editingId}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1 border-gray-300 text-gray-600 hover:text-primary hover:border-primary"
                    >
                        <Plus className="w-3 h-3" />
                        הוסף רשומה חדשה
                    </Button>
                </div>
            )}

            <div className="overflow-x-auto border border-gray-300 bg-white shadow-sm rounded-sm">
                <table className="w-full text-xs text-right border-collapse font-sans">
                    <thead className="bg-[#EAECEE] text-gray-700 font-bold sticky top-0">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key as string}
                                    className="p-1 px-2 border-l border-b border-white last:border-l-0 whitespace-nowrap bg-[#EAECEE]"
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                            <th className="w-[80px] p-1 px-2 border-b border-white">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {/* New Row Input */}
                        {isAdding && (
                            <tr className="bg-blue-50">
                                {columns.map((col) => (
                                    <td key={`new-${col.key as string}`} className="p-1 px-2 border-b border-gray-200 border-l border-l-gray-100 last:border-l-0">
                                        {col.editable !== false ? renderInput(col, (newRowValues as any)[col.key], true) : '-'}
                                    </td>
                                ))}
                                <td className="p-1 px-2 border-b border-gray-200 flex items-center justify-center gap-1">
                                    <button onClick={handleSaveAdd} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleCancelAdd} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        )}

                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="p-4 text-center text-gray-400">
                                    טוען נתונים...
                                </td>
                            </tr>
                        ) : data.length === 0 && !isAdding ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="p-4 text-center text-gray-400">
                                    אין נתונים להצגה
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        "hover:bg-[#EBF5FB] transition-colors odd:bg-white even:bg-[#F8F9F9]",
                                        editingId === row.id ? "bg-blue-50" : ""
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={`${row.id}-${col.key as string}`}
                                            className="p-1 px-2 border-b border-gray-200 border-l border-l-gray-100 last:border-l-0 text-gray-800 truncate max-w-[200px]"
                                            onClick={() => !editingId && col.editable !== false && handleEditClick(row)}
                                        >
                                            {editingId === row.id && col.editable !== false ? (
                                                renderInput(col, (editValues as any)[col.key])
                                            ) : (
                                                <div className={cn("min-h-[20px] cursor-text", col.editable !== false && "group-hover:text-primary")}>
                                                    {col.render ? col.render(row) : (row as any)[col.key]}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-1 px-2 border-b border-gray-200 flex items-center justify-center gap-1 opacity-100">
                                        {editingId === row.id ? (
                                            <>
                                                <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEditClick(row)}
                                                    className="p-1 text-gray-400 hover:text-primary hover:bg-blue-50 rounded"
                                                    title="ערוך"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                    title="מחק"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
