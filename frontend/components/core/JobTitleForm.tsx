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
        <div className="bg-[var(--ui-bg)] min-h-[400px] flex flex-col border border-[var(--ui-border-strong)] font-sans rounded-lg overflow-hidden" dir="rtl">
            {/* Header Bar */}
            <div className="bg-white border-b border-[var(--ui-border)] p-2 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-[var(--ui-text)]">{jobNumber} - {initialData?.title || 'תפקיד חדש (New Job)'}</span>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={requestExit} className="p-1 hover:bg-[var(--ui-accent-soft)] rounded text-red-500" title="סגור"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Form Body - Record View Layout */}
            <form id="job-title-form" onSubmit={handleSubmit(onSubmit, onError)} className="p-8 pt-10 space-y-12 flex-1 overflow-y-auto relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl">

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-[var(--ui-text)] w-32 shrink-0">שם התפקיד</label>
                            <div className="flex-1 relative">
                                <input
                                    {...register('title')}
                                    className="click-ui-input h-8 font-medium"
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
                                className="flex-1 h-8 bg-gray-100 border border-[var(--ui-border)] px-2 text-sm font-mono rounded-md"
                            />
                        </div>
                    </div>

                    {/* Left Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-[var(--ui-text)] w-32 shrink-0">דירוג ברירת מחדל</label>
                            <div className="flex-1">
                                <select
                                    {...register('default_grade_id')}
                                    className="click-ui-input h-8 bg-white"
                                >
                                    <option value="">בחר דירוג...</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} (רמה {g.level})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-[var(--ui-text)] w-32 shrink-0">תאריך תחולה</label>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    {...register('effective_date')}
                                    className="click-ui-input h-8"
                                />
                                {errors.effective_date && <p className="text-red-500 text-[10px]">{errors.effective_date.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-[var(--ui-text)] w-32 shrink-0">גמר תוקף</label>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    {...register('expiry_date')}
                                    className="click-ui-input h-8 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Status Bar - Branded Teal */}
                <div className="mt-8 border border-[var(--ui-border-strong)] bg-white p-3 flex items-start gap-3 shadow-inner rounded-md">
                    <div className="w-8 h-8 shrink-0 bg-[var(--ui-accent-soft)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-accent)]">📖</div>
                    <div className="flex-1">
                        <p className="text-[12px] leading-tight text-[var(--ui-text)] font-medium">
                            הגדרת התפקיד בקטלוג המשרות פעילה.
                        </p>
                        <p className="text-[10px] text-[var(--ui-text-soft)] mt-1">
                            מזהה מערכת: {initialData?.id || 'טרם נוצר'}
                        </p>
                    </div>
                </div>
            </form>

            {/* Bottom Action Bar */}
            <div className="bg-[var(--ui-surface-soft)] border-t border-[var(--ui-border)] p-2 flex gap-3 mt-auto">
                <button
                    type="button"
                    onClick={requestExit}
                    className="h-8 bg-white border border-[var(--ui-border-strong)] text-[var(--ui-text)] hover:bg-[#f4f9fc] px-8 text-xs font-bold shadow-sm rounded-md"
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
