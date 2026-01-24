'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { EmployeeSelect } from '@/components/core/EmployeeSelect'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const orgUnitSchema = z.object({
    name: z.string().min(2, 'שם היחידה חייב להכיל לפחות 2 תווים'),
    type: z.string().min(1, 'חובה לבחור סוג יחידה'),
    parent_id: z.string().nullable(),
    manager_id: z.string().nullable(),
    effective_date: z.string().min(1, 'חובה להזין תאריך תחולה'),
    expiry_date: z.string().nullable().optional(),
})

type OrgUnitFormValues = z.infer<typeof orgUnitSchema>

interface OrgUnitFormProps {
    parentId?: string | null
    parentType?: string | null
    initialData?: {
        id: string
        name: string
        type: string
        unit_number?: string
        parent_id?: string | null
        manager_id: string | null
        effective_date?: string
        expiry_date?: string | null
    }
    onSuccess: () => void
    onCancel: () => void
    levels: string[]
    forcedType?: string
}

export function OrgUnitForm({ parentId, parentType, initialData, onSuccess, onCancel, levels, forcedType }: OrgUnitFormProps) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [unitNumber, setUnitNumber] = useState<string>(initialData?.unit_number || '')

    const getNextLevel = () => {
        if (initialData) return initialData.type
        if (forcedType) return forcedType
        if (!parentType) return levels[0] || 'Wing'
        const index = levels.indexOf(parentType)
        if (index === -1 || index >= levels.length - 1) return levels[levels.length - 1]
        return levels[index + 1]
    }

    const defaultType = getNextLevel()
    const showParentSelect = !parentId && !initialData && levels.indexOf(defaultType) > 0

    useEffect(() => {
        if (!initialData && currentOrg) {
            const fetchNextNumber = async () => {
                const { data, error } = await supabase
                    .from('org_units')
                    .select('unit_number')
                    .eq('organization_id', currentOrg.id)
                    .order('unit_number', { ascending: false })
                    .limit(1)

                if (data && data.length > 0) {
                    const lastNum = parseInt(data[0].unit_number) || 0
                    const nextNum = (lastNum + 1).toString().padStart(3, '0')
                    setUnitNumber(nextNum)
                } else {
                    setUnitNumber('001')
                }
            }
            fetchNextNumber()
        }
    }, [currentOrg, initialData])

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<OrgUnitFormValues>({
        resolver: zodResolver(orgUnitSchema),
        defaultValues: {
            name: initialData?.name || '',
            type: defaultType,
            parent_id: initialData?.parent_id || (parentId || null),
            manager_id: initialData?.manager_id || null,
            effective_date: initialData?.effective_date || new Date().toISOString().split('T')[0],
            expiry_date: initialData?.expiry_date || null,
        },
    })

    const onSubmit = async (vals: OrgUnitFormValues) => {
        if (!currentOrg) return
        setLoading(true)
        try {
            if (!unitNumber && !initialData) {
                toast.error('מזהה יחידה חסר. אנא המתן לטעינה.')
                return
            }

            if (initialData) {
                const { error } = await supabase
                    .from('org_units')
                    .update({
                        name: vals.name,
                        manager_id: vals.manager_id,
                        effective_date: vals.effective_date,
                        expiry_date: vals.expiry_date || null
                    })
                    .eq('id', initialData.id)
                if (error) throw error
                toast.success('היחידה עודכנה בהצלחה')
            } else {
                const { error } = await supabase.from('org_units').insert({
                    organization_id: currentOrg.id,
                    name: vals.name,
                    type: vals.type,
                    parent_id: vals.parent_id,
                    unit_number: unitNumber,
                    manager_id: vals.manager_id,
                    effective_date: vals.effective_date,
                    expiry_date: vals.expiry_date || null
                })
                if (error) throw error
                toast.success('היחידה נוצרה בהצלחה')
            }
            onSuccess()
        } catch (error: any) {
            console.error('Error saving org unit:', error)
            toast.error(`שגיאה בשמירה: ${error.message || 'שגיאה כללית'}`)
        } finally {
            setLoading(false)
        }
    }

    const onError = (errors: any) => {
        console.error('Validation Errors:', errors)
        toast.error('יש למלא את כל שדות החובה המסומנים')
    }

    const titleLabel = forcedType === 'Wing' ? 'אגף' : forcedType === 'Department' ? 'מחלקה' : forcedType === 'Division' ? 'חטיבה' : forcedType === 'Team' ? 'צוות' : 'יחידה'

    return (
        <div className="bg-[#f3f4f6] min-h-[400px] flex flex-col border border-gray-400 font-sans" dir="rtl">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-800">{unitNumber} - {initialData?.name || `חדש (${titleLabel})`}</span>
                </div>
                <div className="flex gap-2">
                    <button type="submit" form="org-unit-form" className="p-1 hover:bg-gray-100 rounded text-[#00A896]" title="שמור"><Save className="w-5 h-5" /></button>
                    <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded text-red-500" title="סגור"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Form Body - Record View Layout */}
            <form id="org-unit-form" onSubmit={handleSubmit(onSubmit, onError)} className="p-6 space-y-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl">

                    {/* Right Column (Labels on the right because RTL) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">שם ה{titleLabel}</label>
                            <div className="flex-1 relative">
                                <input
                                    {...register('name')}
                                    className="w-full h-8 bg-[#E0F5F3] border border-[#00A896]/30 px-2 text-sm focus:border-[#00A896] focus:ring-1 focus:ring-[#00A896]/20 outline-none shadow-sm font-medium"
                                />
                                {errors.name && <p className="absolute -bottom-4 right-0 text-red-500 text-[10px]">{errors.name.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-gray-400">
                            <label className="text-sm font-bold w-32 shrink-0">קוד מזהה</label>
                            <input
                                value={unitNumber}
                                disabled
                                className="flex-1 h-8 bg-gray-100 border border-gray-300 px-2 text-sm font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">סוג ישות</label>
                            <input
                                value={defaultType}
                                disabled
                                className="flex-1 h-8 bg-gray-100 border border-gray-300 px-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Left Column */}
                    <div className="space-y-4">
                        {showParentSelect && (
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-gray-700 w-32 shrink-0">שייך ל-</label>
                                <div className="flex-1">
                                    <Controller
                                        name="parent_id"
                                        control={control}
                                        render={({ field }) => (
                                            <UnitSelect
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                type={levels[levels.indexOf(defaultType) - 1]}
                                                className="h-8 text-sm"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 w-32 shrink-0">מנהל אחראי</label>
                            <div className="flex-1">
                                <Controller
                                    name="manager_id"
                                    control={control}
                                    render={({ field }) => (
                                        <EmployeeSelect
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            className="h-8 text-sm"
                                        />
                                    )}
                                />
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
                            הגדרת היחידה הארגונית בתוקף.
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            הפעילות מבוצעת על קובץ האירועים : תקשורת - אירועי עדכון אמיתי
                        </p>
                    </div>
                </div>
            </form>

            {/* Bottom Action Bar */}
            <div className="bg-[#d1d5db] border-t border-gray-400 p-2 flex gap-3 mt-auto">
                <button
                    type="submit"
                    form="org-unit-form"
                    disabled={loading}
                    className="h-8 bg-white border border-gray-500 text-gray-800 hover:bg-gray-100 px-8 text-xs font-bold shadow-sm active:shadow-inner"
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

import { UnitSelect } from './UnitSelect'
