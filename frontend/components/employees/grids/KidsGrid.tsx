'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChildRecord {
    id: string
    first_name: string
    last_name: string
    id_number: string
    birth_date: string
    gender: 'M' | 'F' | 'Other'
}

interface KidsGridProps {
    employeeId: string
    organizationId: string
}

export default function KidsGrid({ employeeId, organizationId }: KidsGridProps) {
    const [data, setData] = useState<ChildRecord[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (employeeId && organizationId && employeeId !== 'undefined' && organizationId !== 'undefined') {
            fetchData()
        }
    }, [employeeId, organizationId])

    const fetchData = async () => {
        if (!employeeId || !organizationId || employeeId === 'undefined' || organizationId === 'undefined') {
            console.warn('KidsGrid: Missing or invalid IDs', { employeeId, organizationId })
            return
        }

        setLoading(true)
        try {
            const { data: records, error } = await supabase
                .from('employee_children')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('organization_id', organizationId)
                .order('birth_date', { ascending: false })

            if (error) throw error
            setData(records || [])
        } catch (error) {
            console.error('Error fetching children:', JSON.stringify(error, null, 2))
            toast.error('שגיאה בטעינת נתונים')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id: string, field: keyof ChildRecord, value: any) => {
        // Optimistic update
        const originalData = [...data]
        setData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))

        try {
            const { error } = await supabase
                .from('employee_children')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating child:', error)
            toast.error('שגיאה בעדכון')
            setData(originalData) // Revert
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק?')) return

        try {
            const { error } = await supabase.from('employee_children').delete().eq('id', id)
            if (error) throw error
            setData(prev => prev.filter(row => row.id !== id))
            toast.success('נמחק בהצלחה')
        } catch (error) {
            console.error('Error deleting child:', error)
            toast.error('שגיאה במחיקה')
        }
    }

    const handleAddNew = async () => {
        try {
            const { data: newRow, error } = await supabase
                .from('employee_children')
                .insert({
                    organization_id: organizationId,
                    employee_id: employeeId,
                    first_name: '',
                    last_name: '',
                    gender: 'M'
                })
                .select()
                .single()

            if (error) throw error
            setData(prev => [...prev, newRow])
            // Focus logic could go here
        } catch (error) {
            console.error('Error adding child:', error)
            toast.error('שגיאה בהוספת שורה')
        }
    }

    return (
        <div className="w-full border border-gray-300 bg-white">
            <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-[#EAECEE] text-gray-700 font-bold sticky top-0 z-10">
                    <tr>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[150px]">שם פרטי</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[150px]">שם משפחה</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[120px]">ת.ז</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[100px]">תאריך לידה</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[80px]">מגדר</th>
                        <th className="p-1 px-2 border-b border-white w-[50px] text-center">פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-400">טוען נתונים...</td></tr>
                    ) : (
                        <>
                            {data.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50 group transition-colors">
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.first_name || ''}
                                            onChange={(e) => handleUpdate(row.id, 'first_name', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.last_name || ''}
                                            onChange={(e) => handleUpdate(row.id, 'last_name', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.id_number || ''}
                                            onChange={(e) => handleUpdate(row.id, 'id_number', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            type="date"
                                            value={row.birth_date || ''}
                                            onChange={(e) => handleUpdate(row.id, 'birth_date', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <select
                                            value={row.gender || 'M'}
                                            onChange={(e) => handleUpdate(row.id, 'gender', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        >
                                            <option value="M">זכר</option>
                                            <option value="F">נקבה</option>
                                            <option value="Other">אחר</option>
                                        </select>
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
                                <td colSpan={6} className="p-2 text-center text-gray-500 font-medium text-xs border-l-4 border-l-transparent group-hover:border-l-primary flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    לחץ כאן להוספת שורה חדשה
                                </td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </div>
    )
}
