'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useScreenExit } from '@/lib/screen-lifecycle/useScreenExit'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const jobTitleSchema = z.object({
    title: z.string().min(2, 'שם התפקיד חייב להכיל לפחות 2 תווים'),
    default_grade_id: z.string().nullable().optional(),
    effective_date: z.string().min(1, 'חובה להזין תאריך תחולה'),
    expiry_date: z.string().nullable().optional(),
})

type JobTitleFormValues = z.infer<typeof jobTitleSchema>

interface JobTitleFormProps {
    initialData?: {
        id: string
        title: string
        job_number?: string
        default_grade_id: string | null
        effective_date?: string
        expiry_date?: string | null
    }
    onSuccess: () => void
    onCancel: () => void
}

export function JobTitleForm({ initialData, onSuccess, onCancel }: JobTitleFormProps) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [grades, setGrades] = useState<{ id: string, name: string, level: number }[]>([])
    const [jobNumber, setJobNumber] = useState<string>(initialData?.job_number || '---')

    useEffect(() => {
        if (!currentOrg) return
        supabase.from('job_grades').select('*').eq('organization_id', currentOrg.id).order('level')
            .then(({ data }) => setGrades(data || []))
    }, [currentOrg])

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<JobTitleFormValues>({
        resolver: zodResolver(jobTitleSchema),
        defaultValues: {
            title: initialData?.title || '',
            default_grade_id: initialData?.default_grade_id || '',
            effective_date: initialData?.effective_date || new Date().toISOString().split('T')[0],
            expiry_date: initialData?.expiry_date || null,
        },
    })

    const onSubmit = async (data: JobTitleFormValues) => {
        if (!currentOrg) return
        setLoading(true)

        try {
            const payload = {
                organization_id: currentOrg.id,
                title: data.title,
                default_grade_id: data.default_grade_id || null,
                effective_date: data.effective_date,
                expiry_date: data.expiry_date || null
            }

            if (initialData) {
                const { error } = await supabase
                    .from('job_titles')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) {
                    if (error.code === '23505') {
                        toast.error('שם תפקיד זה כבר קיים במערכת')
                    } else {
                        throw error
                    }
                }
            } else {
                const { error } = await supabase.from('job_titles').insert(payload)
                if (error) {
                    if (error.code === '23505') {
                        toast.error('שם תפקיד זה כבר קיים במערכת')
                    } else {
                        throw error
                    }
                }
            }
            onSuccess()
        } catch (error: any) {
            console.error('Error saving job title:', error)
            toast.error(`שגיאה בשמירה: ${error.message || 'שגיאה כללית'}`)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const onError = (errors: any) => {
        console.error('Validation Errors:', errors)
        toast.error('יש למלא את כל שדות החובה המסומנים')
        throw new Error('Validation failed')
    }

    const {
        isConfirmOpen,
        requestExit,
        handleConfirmSave,
        handleConfirmDiscard,
        handleConfirmCancel,
    } = useScreenExit({
        isDirty,
        save: async () => {
            await handleSubmit(onSubmit, onError)()
        },
        onExit: onCancel,
        fallbackRoute: '/dashboard/core/titles',
        exitAfterSave: false,
    })

    return (
        <div className="bg-[#f3f4f6] min-h-[400px] flex flex-col border border-gray-400 font-sans" dir="rtl">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-800">{jobNumber} - {initialData?.title || 'תפקיד חדש (New Job)'}</span>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={requestExit} className="p-1 hover:bg-gray-100 rounded text-red-500" title="סגור"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Form Body - Record View Layout */}
            <form id="job-title-form" onSubmit={handleSubmit(onSubmit, onError)} className="p-8 pt-10 space-y-12 flex-1 overflow-y-auto relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl">

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">שם התפקיד</label>
                            <div className="flex-1 relative">
                                <input
                                    {...register('title')}
                                    className="w-full h-8 bg-[#E0F5F3] border border-[#00A896]/30 px-2 text-sm focus:border-[#00A896] focus:ring-1 focus:ring-[#00A896]/20 outline-none shadow-sm font-medium"
                                    placeholder="לדוגמה: מפתח פול סטאק"
                                />
                                {errors.title && <p className="absolute -bottom-4 right-0 text-red-500 text-[10px]">{errors.title.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-gray-400">
                            <label className="text-sm font-bold w-32 shrink-0">מספר מזהה</label>
                            <input
                                value={jobNumber}
                                disabled
                                className="flex-1 h-8 bg-gray-100 border border-gray-300 px-2 text-sm font-mono"
                            />
                        </div>
                    </div>

                    {/* Left Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">דירוג ברירת מחדל</label>
                            <div className="flex-1">
                                <select
                                    {...register('default_grade_id')}
                                    className="w-full h-8 bg-white border border-gray-400 px-2 text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="">בחר דירוג...</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} (רמה {g.level})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">תאריך תחולה</label>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    {...register('effective_date')}
                                    className="w-full h-8 bg-[#E0F5F3] border border-[#00A896]/30 px-2 text-sm focus:border-[#00A896] outline-none"
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

                {/* Status Bar - Branded Teal */}
                <div className="mt-8 border-[1.5px] border-[#00A896] bg-white p-3 flex items-start gap-3 shadow-inner">
                    <div className="w-8 h-8 shrink-0 bg-[#E0F5F3] border border-[#00A896]/30 flex items-center justify-center text-[#00A896]">📖</div>
                    <div className="flex-1">
                        <p className="text-[12px] leading-tight text-gray-700 font-medium">
                            הגדרת התפקיד בקטלוג המשרות פעילה.
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            מזהה מערכת: {initialData?.id || 'טרם נוצר'}
                        </p>
                    </div>
                </div>
            </form>

            {/* Bottom Action Bar */}
            <div className="bg-[#d1d5db] border-t border-gray-400 p-2 flex gap-3 mt-auto">
                <button
                    type="button"
                    onClick={requestExit}
                    className="h-8 bg-white border border-gray-500 text-gray-800 hover:bg-gray-100 px-8 text-xs font-bold shadow-sm"
                >
                    יציאה (Exit)
                </button>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onConfirm={handleConfirmSave}
                onDiscard={handleConfirmDiscard}
                onCancel={handleConfirmCancel}
            />
        </div>
    )
}
