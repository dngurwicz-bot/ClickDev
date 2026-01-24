'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { EmployeeSelect } from '@/components/core/EmployeeSelect'

const orgUnitSchema = z.object({
    name: z.string().min(2, 'שם היחידה חייב להכיל לפחות 2 תווים'),
    type: z.string().min(1, 'חובה לבחור סוג יחידה'),
    parent_id: z.string().nullable(),
    manager_id: z.string().nullable(),
})

type OrgUnitFormValues = z.infer<typeof orgUnitSchema>

interface OrgUnitFormProps {
    parentId?: string | null
    parentType?: string | null
    initialData?: {
        id: string
        name: string
        type: string
        manager_id: string | null
    }
    onSuccess: () => void
    onCancel: () => void
    levels: string[]
}

export function OrgUnitForm({ parentId, parentType, initialData, onSuccess, onCancel, levels, forcedType }: OrgUnitFormProps & { forcedType?: string }) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)

    // Determine valid type
    const getNextLevel = () => {
        if (initialData) return initialData.type
        if (forcedType) return forcedType
        if (!parentType) return levels[0] || 'Wing'
        const index = levels.indexOf(parentType)
        if (index === -1 || index >= levels.length - 1) return levels[levels.length - 1]
        return levels[index + 1]
    }

    const defaultType = getNextLevel()

    // Check if we need to show parent select
    // Show if: no parentId passed AND type is not the first level (root)
    const showParentSelect = !parentId && !initialData && levels.indexOf(defaultType) > 0

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
            parent_id: initialData ? undefined : (parentId || null),
            manager_id: initialData?.manager_id || null,
        },
    })

    const onSubmit = async (data: OrgUnitFormValues) => {
        if (!currentOrg) return
        setLoading(true)

        try {
            if (initialData) {
                // Update
                const { error } = await supabase
                    .from('org_units')
                    .update({
                        name: data.name,
                        manager_id: data.manager_id,
                    })
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // Create
                const { error } = await supabase.from('org_units').insert({
                    organization_id: currentOrg.id,
                    name: data.name,
                    type: data.type,
                    parent_id: data.parent_id,
                    manager_id: data.manager_id,
                })

                if (error) throw error
            }
            onSuccess()
        } catch (error) {
            console.error('Error saving org unit:', error)
            alert('שגיאה בשמירת היחידה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6 w-full max-w-md mx-auto shadow-none border-0">
            <h2 className="text-xl font-bold mb-4">{initialData ? 'ערוך יחידה' : `הוסף ${forcedType === 'Wing' ? 'אגף' : forcedType === 'Department' ? 'מחלקה' : 'יחידה'}`}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">שם היחידה</label>
                    <Input {...register('name')} placeholder="לדוגמה: מחלקת פיתוח" />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">סוג יחידה</label>
                    <Input {...register('type')} disabled value={defaultType} className="bg-gray-100" />
                </div>

                {showParentSelect && (
                    <div>
                        <label className="block text-sm font-medium mb-1">שייך ל-</label>
                        <Controller
                            name="parent_id"
                            control={control}
                            render={({ field }) => (
                                <UnitSelect
                                    value={field.value}
                                    onChange={field.onChange}
                                    // Fetch types that are ONE level above? Or just any?
                                    // Usually strict hierarchy: Wing -> Department
                                    // If we are creating Department (index 1), we need Wing (index 0)
                                    type={levels[levels.indexOf(defaultType) - 1]}
                                    placeholder="בחר יחידת אם..."
                                />
                            )}
                        />
                        {errors.parent_id && <p className="text-red-500 text-sm">{errors.parent_id.message}</p>}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">מנהל היחידה</label>
                    <Controller
                        name="manager_id"
                        control={control}
                        render={({ field }) => (
                            <EmployeeSelect
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="חפש מנהל..."
                            />
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        ביטול
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'שומר...' : (initialData ? 'שמור שינויים' : 'צור')}
                    </Button>
                </div>
            </form>
        </Card>
    )
}

// Need to import UnitSelect
import { UnitSelect } from './UnitSelect'
