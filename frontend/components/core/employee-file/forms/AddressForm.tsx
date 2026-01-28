'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Loader2, Save, X } from 'lucide-react'
import { authFetch } from '@/lib/api'

const addressSchema = z.object({
    valid_from: z.string().min(1, 'תאריך תוקף הוא שדה חובה'),
    city_name: z.string().optional(),
    city_code: z.string().optional(),
    street: z.string().optional(),
    house_number: z.string().optional(),
    apartment: z.string().optional(),
    entrance: z.string().optional(),
    postal_code: z.string().optional(),
    phone: z.string().optional(),
    po_box: z.string().optional(),
    po_box_city: z.string().optional(),
    po_box_postal_code: z.string().optional(),
})

type AddressFormValues = z.infer<typeof addressSchema>

interface AddressFormProps {
    employeeId: string
    organizationId: string
    initialData?: any
    onSuccess: () => void
    onCancel?: () => void
}

export function AddressForm({ employeeId, organizationId, initialData, onSuccess, onCancel }: AddressFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            valid_from: initialData?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
            city_name: initialData?.city_name || '',
            city_code: initialData?.city_code || '',
            street: initialData?.street || '',
            house_number: initialData?.house_number || '',
            apartment: initialData?.apartment || '',
            entrance: initialData?.entrance || '',
            postal_code: initialData?.postal_code || '',
            phone: initialData?.phone || '',
            po_box: initialData?.po_box || '',
            po_box_city: initialData?.po_box_city || '',
            po_box_postal_code: initialData?.po_box_postal_code || '',
        }
    })

    const onSubmit = async (data: AddressFormValues) => {
        setLoading(true)
        try {
            const payload = {
                employee_id: employeeId,
                organization_id: organizationId,
                ...data,
                action_code: 'A'
            }

            console.log('[AddressForm] Submitting address form with payload:', payload)

            const response = await authFetch('/api/events/218', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            console.log('[AddressForm] Response status:', response.status)

            if (!response.ok) {
                const error = await response.json()
                console.error('[AddressForm] Backend error:', error)
                throw new Error(error.detail || 'שגיאה בשמירת הכתובת')
            }

            const responseData = await response.json()
            console.log('[AddressForm] Success response:', responseData)
            
            toast.success('הכתובת נשמרה בהצלחה')
            onSuccess()
        } catch (error: any) {
            console.error('[AddressForm] Error saving address:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const onError = (errors: any) => {
        console.error('Validation errors:', errors)
        const firstError = Object.values(errors)[0] as any
        if (firstError) {
            toast.error(`שגיאה בטופס: ${firstError.message}`)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#f3f4f6] overflow-hidden font-sans border border-gray-400 relative z-30" dir="rtl">
            {/* Header Bar - Hilan Style */}
            <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-800">218 - כתובת</span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={form.handleSubmit(onSubmit, onError)}
                        className="p-1 hover:bg-gray-100 rounded text-[#00A896]"
                        title="שמור"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-1 hover:bg-gray-100 rounded text-red-500"
                            title="סגור"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="flex-1 overflow-auto p-8 pt-6 content-start">
                <div className="space-y-8 w-full max-w-5xl mx-auto">
                    {/* Validity Date Section */}
                    <div className="space-y-3">
                        <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                            <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                            <h3 className="text-base font-bold text-blue-900 leading-none">תאריך תוקף</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-3">
                            <FormRow label="תאריך תוקף" required error={form.formState.errors.valid_from?.message}>
                                <Input
                                    type="date"
                                    {...form.register('valid_from')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm font-bold"
                                />
                            </FormRow>
                        </div>
                    </div>

                    {/* Primary Address Section */}
                    <div className="space-y-3">
                        <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                            <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                            <h3 className="text-base font-bold text-blue-900 leading-none">כתובת מגורים</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                            <FormRow label="שם יישוב">
                                <Input
                                    {...form.register('city_name')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="סמל יישוב">
                                <Input
                                    {...form.register('city_code')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="רחוב">
                                <Input
                                    {...form.register('street')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="מספר בית">
                                <Input
                                    {...form.register('house_number')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="דירה">
                                <Input
                                    {...form.register('apartment')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="כניסה">
                                <Input
                                    {...form.register('entrance')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="מיקוד">
                                <Input
                                    {...form.register('postal_code')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="טלפון">
                                <Input
                                    {...form.register('phone')}
                                    dir="ltr"
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                        </div>
                    </div>

                    {/* PO Box Section */}
                    <div className="space-y-3">
                        <div className="border-b border-gray-300 pb-1 mb-4 flex items-center gap-2">
                            <span className="h-4 w-1 bg-gray-400 rounded-full"></span>
                            <h3 className="text-base font-bold text-gray-700 leading-none">תיבת דואר</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-3">
                            <FormRow label="ת. דואר">
                                <Input
                                    {...form.register('po_box')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="ישוב ת. דואר">
                                <Input
                                    {...form.register('po_box_city')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                            <FormRow label="מיקוד ת. דואר">
                                <Input
                                    {...form.register('po_box_postal_code')}
                                    className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm"
                                />
                            </FormRow>
                        </div>
                    </div>
                </div>
            </form>

            {/* Hilan Action Bar (Bottom Bar) */}
            <div className="h-12 bg-[#d1d5db] border-t border-gray-400 flex items-center px-4 justify-between shrink-0 shadow-inner z-20">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-8 bg-white border border-gray-500 text-gray-800 hover:bg-gray-100 px-6 text-xs font-bold shadow-sm"
                >
                    יציאה (Exit)
                </button>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => form.reset()}
                        className="h-8 bg-white border border-red-400 text-red-600 hover:bg-red-50 px-6 text-xs font-bold shadow-sm"
                    >
                        ביטול שינויים
                    </button>
                    <button
                        onClick={form.handleSubmit(onSubmit, onError)}
                        disabled={loading}
                        className="h-8 bg-white border border-gray-500 text-gray-800 hover:bg-gray-100 px-6 text-xs font-bold shadow-sm flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                        עדכון (Save)
                    </button>
                </div>
            </div>
        </div>
    )
}

function FormRow({ label, children, required, error }: { label: string; children: React.ReactNode; required?: boolean; error?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <Label className="w-28 text-right text-sm font-semibold text-slate-700 shrink-0 leading-tight">
                    {label}{required && <span className="text-red-500 mr-1">*</span>}
                </Label>
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
            {error && <p className="text-xs text-red-600 text-right pr-2 font-medium">{error}</p>}
        </div>
    )
}
