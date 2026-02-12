'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { UnitSelect } from '@/components/core/UnitSelect'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useScreenExit } from '@/lib/screen-lifecycle/useScreenExit'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const positionSchema = z.object({
    job_title_id: z.string().min(1, 'חובה לבחור תפקיד'),
    org_unit_id: z.string().min(1, 'חובה לבחור שיוך ארגוני'),
    is_manager_position: z.boolean().default(false),
    occupant_id: z.string().nullable().optional(),
    effective_date: z.string().min(1, 'חובה להזין תאריך תחולה'),
    expiry_date: z.string().nullable().optional(),
})

type PositionFormValues = z.infer<typeof positionSchema>

interface PositionFormProps {
    initialData?: {
        id: string
        job_title_id: string
        org_unit_id: string
        is_manager_position: boolean
        occupant_id?: string | null
        effective_date?: string
        expiry_date?: string | null
    }
    onSuccess: () => void
    onCancel: () => void
}

export function PositionForm({ initialData, onSuccess, onCancel }: PositionFormProps) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [jobTitles, setJobTitles] = useState<{ id: string, title: string }[]>([])

    useEffect(() => {
        if (!currentOrg) return
        supabase.from('job_titles').select('id, title').eq('organization_id', currentOrg.id)
            .then(({ data }) => setJobTitles(data || []))
    }, [currentOrg])

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isDirty },
    } = useForm<PositionFormValues>({
        resolver: zodResolver(positionSchema),
        defaultValues: {
            job_title_id: initialData?.job_title_id || '',
            org_unit_id: initialData?.org_unit_id || '',
            is_manager_position: initialData?.is_manager_position || false,
            occupant_id: initialData?.occupant_id || null,
            effective_date: initialData?.effective_date || new Date().toISOString().split('T')[0],
            expiry_date: initialData?.expiry_date || null,
        },
    })

    const onSubmit = async (data: PositionFormValues) => {
        if (!currentOrg) return
        setLoading(true)

        try {
            const payload = {
                organization_id: currentOrg.id,
                ...data,
                expiry_date: data.expiry_date || null
            }

            if (initialData) {
                const { error } = await supabase
                    .from('positions')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('positions').insert(payload)
                if (error) throw error
            }
            onSuccess()
        } catch (error: any) {
            console.error('Error saving position:', error)
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
        fallbackRoute: '/dashboard/core/positions',
        exitAfterSave: false,
    })

    return (
        <div className="bg-[#f3f4f6] min-h-[450px] flex flex-col border border-gray-400 font-sans" dir="rtl">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-800">תקן {initialData?.id.slice(0, 4) || 'חדש'} - {jobTitles.find(t => t.id === initialData?.job_title_id)?.title || 'הגדרת תקן'}</span>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={requestExit} className="p-1 hover:bg-gray-100 rounded text-red-500" title="סגור"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Form Body - Record View Layout */}
            <form id="position-form" onSubmit={handleSubmit(onSubmit, onError)} className="p-8 pt-10 space-y-12 flex-1 overflow-y-auto relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl">

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">תפקיד (מקטלוג)</label>
                            <div className="flex-1">
                                <select
                                    {...register('job_title_id')}
                                    className="w-full h-8 bg-[#E0F5F3] border border-[#00A896]/30 px-2 text-sm focus:border-[#00A896] outline-none shadow-sm font-medium"
                                >
                                    <option value="">בחר תפקיד...</option>
                                    {jobTitles.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                                {errors.job_title_id && <p className="text-red-500 text-[10px]">{errors.job_title_id.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">שיוך ארגוני</label>
                            <div className="flex-1">
                                <Controller
                                    name="org_unit_id"
                                    control={control}
                                    render={({ field }) => (
                                        <UnitSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="h-8 text-sm"
                                        />
                                    )}
                                />
                                {errors.org_unit_id && <p className="text-red-500 text-[10px]">{errors.org_unit_id.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Left Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">תקן ניהולי</label>
                            <div className="flex-1 flex items-center">
                                <input
                                    type="checkbox"
                                    {...register('is_manager_position')}
                                    className="w-4 h-4 border-gray-400 rounded"
                                />
                                <span className="mr-2 text-xs text-gray-500">(סימון תקן זה כניהולי יאפשר כפיפויות אליו)</span>
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
