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

    // Enforce Structure Lock on Schema (Prevent changing Levels - handled by SetupWizard)
    // Here we just need to ensure we strictly follow the levels.

    // Determine the type we are creating
    const getNextLevel = () => {
        if (initialData) return initialData.type
        if (forcedType) return forcedType
        if (!parentType) return levels[0] || 'Wing' // Fallback

        // Find next level based on hierarchy structure (if available in context) or index
        // Prioritize currentOrg.hierarchy_structure if available
        if (currentOrg?.hierarchy_structure && parentType) {
            const structure = currentOrg.hierarchy_structure as Record<string, string | null>;
            // Find the key where value === parentType
            const childType = Object.keys(structure).find(key => structure[key] === parentType);
            if (childType) return childType;
        }

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
            console.error('Full Error Object:', error)
            const errorMsg = error.message || error.details || JSON.stringify(error)
            toast.error(`שגיאה בשמירה: ${errorMsg}`)
        } finally {
            setLoading(false)
        }
    }

    const onError = (errors: any) => {
        console.warn('Validation Errors:', errors)
        toast.error('יש למלא את כל שדות החובה המסומנים')
    }

    const titleLabel = forcedType === 'Wing' ? 'אגף' : forcedType === 'Department' ? 'מחלקה' : forcedType === 'Division' ? 'חטיבה' : forcedType === 'Team' ? 'צוות' : 'יחידה'

    return (
        <PriorityRecordLayout
            title={initialData?.name || `יצירת ${titleLabel} חדש`}
            subtitle={initialData ? `${titleLabel} (${unitNumber})` : undefined}
            id={unitNumber}
            status="active"
            onSave={handleSubmit(onSubmit, onError)}
            onCancel={onCancel}
            onPrint={() => window.print()}
            onDelete={() => {
                if (confirm('האם אתה בטוח שברצונך למחוק יחידה זו?')) {
                    toast.error('מחיקה תתאפשר בקרוב')
                }
            }}
        >
            <form id="org-unit-form" onSubmit={handleSubmit(onSubmit, onError)} className="flex-1 overflow-y-auto p-8 relative" dir="rtl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl mx-auto">

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
                <div className="mt-8 border-[1.5px] border-[#00A896] bg-white p-3 flex items-start gap-3 shadow-inner max-w-4xl mx-auto">
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
        </PriorityRecordLayout>
    )
}

import { UnitSelect } from './UnitSelect'
import { PriorityRecordLayout } from './PriorityRecordLayout'
