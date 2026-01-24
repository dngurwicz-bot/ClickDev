'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { X, Save } from 'lucide-react'

const jobGradeSchema = z.object({
    name: z.string().min(2, 'שם הדירוג חייב להכיל לפחות 2 תווים'),
    level: z.coerce.number().min(1, 'רמה חייבת להיות לפחות 1'),
    effective_date: z.string().min(1, 'חובה להזין תאריך תחולה'),
    expiry_date: z.string().nullable().optional(),
})

type JobGradeFormValues = z.infer<typeof jobGradeSchema>

interface JobGradeFormProps {
    initialData?: {
        id: string
        name: string
        level: number
        effective_date?: string
        expiry_date?: string | null
    }
    onSuccess: () => void
    onCancel: () => void
}

export function JobGradeForm({ initialData, onSuccess, onCancel }: JobGradeFormProps) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JobGradeFormValues>({
        resolver: zodResolver(jobGradeSchema),
        defaultValues: {
            name: initialData?.name || '',
            level: initialData?.level || 1,
            effective_date: initialData?.effective_date || new Date().toISOString().split('T')[0],
            expiry_date: initialData?.expiry_date || null,
        },
    })

    const onSubmit = async (data: JobGradeFormValues) => {
        if (!currentOrg) return
        setLoading(true)

        try {
            const payload = {
                organization_id: currentOrg.id,
                name: data.name,
                level: data.level,
                effective_date: data.effective_date,
                expiry_date: data.expiry_date || null
            }

            if (initialData) {
                const { error } = await supabase
                    .from('job_grades')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('job_grades').insert(payload)
                if (error) throw error
            }
            onSuccess()
        } catch (error) {
            console.error('Error saving job grade:', error)
            alert('שגיאה בשמירת הדירוג')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[#f3f4f6] min-h-[350px] flex flex-col border border-gray-400 font-sans" dir="rtl">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-800">{initialData?.level || '---'} - {initialData?.name || 'דירוג חדש (New Grade)'}</span>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={handleSubmit(onSubmit)} className="p-1 hover:bg-gray-100 rounded text-blue-600" title="שמור"><Save className="w-5 h-5" /></button>
                    <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded text-red-500" title="סגור"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Form Body - Record View Layout */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl">

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">שם הדירוג</label>
                            <div className="flex-1 relative">
                                <input
                                    {...register('name')}
                                    className="w-full h-8 bg-[#fffde7] border border-gray-400 px-2 text-sm focus:border-blue-500 outline-none shadow-sm"
                                />
                                {errors.name && <p className="absolute -bottom-4 right-0 text-red-500 text-[10px]">{errors.name.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">רמת דירוג</label>
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    {...register('level')}
                                    className="w-full h-8 bg-white border border-gray-400 px-2 text-sm focus:border-blue-500 outline-none shadow-sm"
                                />
                                {errors.level && <p className="absolute -bottom-4 right-0 text-red-500 text-[10px]">{errors.level.message}</p>}
                            </div>
                        </div>
                    </div>
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">תאריך תחולה</label>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    {...register('effective_date')}
                                    className="w-full h-8 bg-[#fffde7] border border-gray-400 px-2 text-sm focus:border-blue-500 outline-none"
                                />
                                {errors.effective_date && <p className="text-red-500 text-[10px]">{errors.effective_date.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">גמר תוקף</label>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    {...register('expiry_date')}
                                    className="w-full h-8 bg-white border border-gray-400 px-2 text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="mt-8 border-[1.5px] border-purple-400 bg-white p-3 flex items-start gap-3 shadow-inner">
                    <div className="w-8 h-8 shrink-0 bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">📖</div>
                    <div className="flex-1">
                        <p className="text-[12px] leading-tight text-gray-700 font-medium">
                            דירוג תפקיד רשום במערכת.
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            רמה זו משמשת כברירת מחדל עבור תיוק משרות ותקנים.
                        </p>
                    </div>
                </div>
            </form>

            {/* Bottom Action Bar */}
            <div className="bg-[#d1d5db] border-t border-gray-400 p-2 flex gap-3 mt-auto">
                <button
                    type="submit"
                    disabled={loading}
                    onClick={handleSubmit(onSubmit)}
                    className="h-8 bg-white border border-gray-500 text-gray-800 hover:bg-gray-100 px-8 text-xs font-bold shadow-sm"
                >
                    {loading ? 'מבצע...' : 'עדכון (Save)'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-8 bg-white border border-gray-500 text-gray-800 hover:bg-gray-100 px-8 text-xs font-bold shadow-sm"
                >
                    יציאה (Exit)
                </button>
            </div>
        </div>
    )
}
