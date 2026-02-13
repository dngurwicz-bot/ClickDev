'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Trash2, Plus } from 'lucide-react'
import { dispatchEmployeeAction } from '@/lib/api'

interface AssetRecord {
    id: string
    type: string
    description: string
    status: string
    serial_number: string
    valid_from: string
    valid_to?: string
    issued_date?: string
    return_date?: string
}

interface AssetsGridProps {
    employeeId: string
    organizationId: string
}

export default function AssetsGrid({ employeeId, organizationId }: AssetsGridProps) {
    const [data, setData] = useState<AssetRecord[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (employeeId && organizationId) fetchData()
    }, [employeeId, organizationId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: records, error } = await supabase
                .from('employee_assets')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('organization_id', organizationId)
                .order('issued_date', { ascending: false })

            if (error) throw error
            setData(records || [])
        } catch (error) {
            console.error('Error fetching assets:', error)
            toast.error('שגיאה בטעינת ציוד')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id: string, field: keyof AssetRecord, value: any) => {
        const originalData = [...data]
        setData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))

        try {
            const { error } = await supabase
                .from('employee_assets')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating asset:', error)
            toast.error('שגיאה בעדכון')
            setData(originalData)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק?')) return

        try {
            const { error } = await supabase.from('employee_assets').delete().eq('id', id)
            if (error) throw error
            setData(prev => prev.filter(row => row.id !== id))
            toast.success('נמחק בהצלחה')
        } catch (error) {
            console.error('Error deleting asset:', error)
            toast.error('שגיאה במחיקה')
        }
    }

    const handleAddNew = async () => {
        try {
            const effectiveAt = new Date().toISOString().split('T')[0]
            await dispatchEmployeeAction(organizationId, employeeId, {
                action_key: 'employee_asset.changed',
                effective_at: effectiveAt,
                request_id: `asset-add-${employeeId}-${Date.now()}`,
                payload: {
                    type: '',
                    description: '',
                    status: 'Assigned',
                    serial_number: '',
                },
            })
            await fetchData()
        } catch (error: any) {
            console.error('Error adding asset:', error)
            toast.error(error.message || 'שגיאה בהוספת שורה')
        }
    }

    return (
        <div className="w-full border border-gray-300 bg-white shadow-sm">
            <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-[#EAECEE] text-gray-700 font-bold sticky top-0 z-10">
                    <tr>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[150px]">סוג נכס</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[180px]">תיאור</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[100px]">סטטוס</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[120px]">מספר סדורי</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[100px]">מתאריך</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[100px]">עד תאריך</th>
                        <th className="p-1 px-2 border-b border-white w-[50px] text-center">פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={7} className="p-4 text-center text-gray-400">טוען נתונים...</td></tr>
                    ) : (
                        <>
                            {data.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50 group transition-colors">
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.type || ''}
                                            onChange={(e) => handleUpdate(row.id, 'type', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.description || ''}
                                            onChange={(e) => handleUpdate(row.id, 'description', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <select
                                            value={row.status || 'Assigned'}
                                            onChange={(e) => handleUpdate(row.id, 'status', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        >
                                            <option value="Assigned">משויך</option>
                                            <option value="Returned">הוחזר</option>
                                            <option value="Lost">אבד</option>
                                        </select>
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.serial_number || ''}
                                            onChange={(e) => handleUpdate(row.id, 'serial_number', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            type="date"
                                            value={row.valid_from || row.issued_date || ''}
                                            onChange={(e) => handleUpdate(row.id, 'valid_from', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            type="date"
                                            value={row.valid_to || row.return_date || ''}
                                            onChange={(e) => handleUpdate(row.id, 'valid_to', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 p-1 text-center">
                                        <button
                                            onClick={() => handleDelete(row.id)}
                                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="מחק שורה"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* New Row Placeholder */}
                            <tr
                                onClick={handleAddNew}
                                className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 group"
                            >
                                <td colSpan={7} className="p-2 text-center text-gray-500 font-medium text-xs border-l-4 border-l-transparent group-hover:border-l-primary flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    לחץ כאן להוספת ציוד חדש
                                </td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </div>
    )
}
