'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BankRecord {
    id: string
    bank_code: string
    branch_code: string
    account_number: string
    account_owner_name: string
    valid_from: string
    valid_to?: string
}

interface BankDetailsGridProps {
    employeeId: string
    organizationId: string
}

export default function BankDetailsGrid({ employeeId, organizationId }: BankDetailsGridProps) {
    const [data, setData] = useState<BankRecord[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (employeeId && organizationId) fetchData()
    }, [employeeId, organizationId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: records, error } = await supabase
                .from('employee_bank_details')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('organization_id', organizationId)
                .order('valid_from', { ascending: false })

            if (error) throw error
            setData(records || [])
        } catch (error) {
            console.error('Error fetching bank details:', error)
            toast.error('שגיאה בטעינת נתוני בנק')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id: string, field: keyof BankRecord, value: any) => {
        const originalData = [...data]
        setData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))

        try {
            const { error } = await supabase
                .from('employee_bank_details')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating bank info:', error)
            toast.error('שגיאה בעדכון')
            setData(originalData)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק?')) return

        try {
            const { error } = await supabase.from('employee_bank_details').delete().eq('id', id)
            if (error) throw error
            setData(prev => prev.filter(row => row.id !== id))
            toast.success('נמחק בהצלחה')
        } catch (error) {
            console.error('Error deleting bank info:', error)
            toast.error('שגיאה במחיקה')
        }
    }

    const handleAddNew = async () => {
        try {
            const { data: newRow, error } = await supabase
                .from('employee_bank_details')
                .insert({
                    organization_id: organizationId,
                    employee_id: employeeId,
                    bank_code: '',
                    branch_code: '',
                    account_number: '',
                    valid_from: new Date().toISOString().split('T')[0]
                })
                .select()
                .single()

            if (error) throw error
            setData(prev => [newRow, ...prev])
        } catch (error) {
            console.error('Error adding bank info:', error)
            toast.error('שגיאה בהוספת שורה')
        }
    }

    return (
        <div className="w-full border border-gray-300 bg-white shadow-sm">
            <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-[#EAECEE] text-gray-700 font-bold sticky top-0 z-10">
                    <tr>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[80px]">קוד בנק</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[80px]">סניף</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[150px]">מספר חשבון</th>
                        <th className="p-1 px-2 border-l border-b border-white last:border-l-0 w-[200px]">שם בעל החשבון</th>
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
                                            value={row.bank_code || ''}
                                            onChange={(e) => handleUpdate(row.id, 'bank_code', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.branch_code || ''}
                                            onChange={(e) => handleUpdate(row.id, 'branch_code', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.account_number || ''}
                                            onChange={(e) => handleUpdate(row.id, 'account_number', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            value={row.account_owner_name || ''}
                                            onChange={(e) => handleUpdate(row.id, 'account_owner_name', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            type="date"
                                            value={row.valid_from || ''}
                                            onChange={(e) => handleUpdate(row.id, 'valid_from', e.target.value)}
                                            className="w-full h-full p-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </td>
                                    <td className="border-b border-gray-200 border-l border-gray-100 p-0">
                                        <input
                                            type="date"
                                            value={row.valid_to || ''}
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
                                    לחץ כאן להוספת חשבון בנק חדש
                                </td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </div>
    )
}
