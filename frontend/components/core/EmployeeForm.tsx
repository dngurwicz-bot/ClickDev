'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { Loader2, Save, X } from 'lucide-react'
import { authFetch } from '@/lib/api'

const employeeSchema = z.object({
    id_number: z.string().min(1, 'תעודת זהות היא שדה חובה'),
    first_name: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
    last_name: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
    first_name_en: z.string().optional(),
    last_name_en: z.string().optional(),
    email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    job_title: z.string().min(2, 'תפקיד הוא שדה חובה'),
    employment_type: z.string().optional(),
    hire_date: z.string().min(1, 'תאריך תחילת עבודה הוא שדה חובה'),
    employee_number: z.string().optional(),
    gender: z.string().optional(),
    passport_number: z.string().optional(),
    prev_last_name: z.string().optional(),
    prev_first_name: z.string().optional(),
    additional_name: z.string().optional(),
    army_status: z.string().optional(),
    army_release_date: z.string().optional(),
    marital_status: z.string().optional(),
    nationality: z.string().optional(),
    birth_date: z.string().optional(),
    birth_country: z.string().optional(),
    address_city: z.string().optional(),
    address_street: z.string().optional(),
    address_zip: z.string().optional(),
    rank_id: z.string().optional(),
    grade_id: z.string().optional(),
    department: z.string().optional(),
    valid_from: z.string().optional(), // For temporal events
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel?: () => void
    onlySections?: string[]
}

export function EmployeeForm({ initialData, onSuccess, onCancel, onlySections }: EmployeeFormProps) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            id_number: initialData?.id_number || '',
            first_name: initialData?.first_name || '',
            last_name: initialData?.last_name || '',
            first_name_en: initialData?.first_name_en || '',
            last_name_en: initialData?.last_name_en || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            mobile: initialData?.mobile || '',
            job_title: initialData?.job_title || '',
            employment_type: initialData?.employment_type || 'full_time',
            hire_date: initialData?.hire_date ? initialData.hire_date.split('T')[0] : new Date().toISOString().split('T')[0],
            employee_number: initialData?.employee_number || '',
            gender: initialData?.gender || 'unknown',
            passport_number: initialData?.passport_number || '',
            prev_last_name: initialData?.prev_last_name || '',
            prev_first_name: initialData?.prev_first_name || '',
            additional_name: initialData?.additional_name || '',
            army_status: initialData?.army_status || '',
            army_release_date: initialData?.army_release_date || '',
            marital_status: initialData?.marital_status || 'single',
            nationality: initialData?.nationality || 'IL',
            birth_date: initialData?.birth_date || '',
            birth_country: initialData?.birth_country || 'Israel',
            address_city: initialData?.address_city || '',
            address_street: initialData?.address_street || '',
            address_zip: initialData?.address_zip || '',
            rank_id: initialData?.rank_id || '',
            grade_id: initialData?.grade_id || '',
            department: initialData?.department || '',
            valid_from: initialData?.valid_from || new Date().toISOString().split('T')[0],
        }
    })

    const onSubmit = async (data: EmployeeFormValues) => {
        if (!currentOrg) return

        setLoading(true)
        try {
            const employeeData = {
                ...data,
                organization_id: currentOrg.id,
                email: data.email || null,
                phone: data.phone || null,
                mobile: data.mobile || null,
                first_name_en: data.first_name_en || null,
                last_name_en: data.last_name_en || null,
                employee_number: data.employee_number || null,
                birth_date: data.birth_date || null,
                army_release_date: data.army_release_date || null,
                passport_number: data.passport_number || null,
                prev_last_name: data.prev_last_name || null,
                prev_first_name: data.prev_first_name || null,
                additional_name: data.additional_name || null,
                address_city: data.address_city || null,
                address_street: data.address_street || null,
                address_zip: data.address_zip || null,
                hire_date: data.hire_date || null,
                rank_id: data.rank_id || null,
                grade_id: data.grade_id || null,
                department: data.department || null,
            }

            let response

            // Special handling for Event 104 (Personal Status) - Temporal Event
            if (onlySections && onlySections.includes('status')) {
                const eventPayload = {
                    employee_id: initialData?.employee_id || initialData?.id || (currentOrg ? null : null), // Need employee ID
                    valid_from: data.valid_from,
                    marital_status: data.marital_status,
                    gender: data.gender,
                    nationality: data.nationality,
                    birth_country: data.birth_country,
                    passport_number: data.passport_number,
                    action_code: 'A' // Default to Update/Insert
                }

                // If we have an existing ID for the employee (from initialData or context), use it.
                // Note: initialData might be the History record, so it might not have employee_id directly if not joined.
                // WE NEED TO ENSURE WE HAVE EMPLOYEE ID. 
                // Suggestion: pass employeeId as prop to EmployeeForm

                response = await authFetch('/api/events/104', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventPayload)
                })

            } else if (initialData && initialData.id) {
                response = await authFetch(`/api/employees/${initialData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employeeData)
                })
            } else {
                response = await authFetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employeeData)
                })
            }

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'שגיאה בשמירת העובד')
            }

            toast.success(initialData ? 'העובד עודכן בהצלחה' : 'העובד נוצר בהצלחה')
            onSuccess()
        } catch (error: any) {
            console.error('Error saving employee:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#f3f4f6] overflow-hidden font-sans border border-gray-400" dir="rtl">
            {/* Header Bar - New Legacy Style */}
            <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-800">
                        {initialData ? `${initialData.first_name || ''} ${initialData.last_name || ''}` : 'עובד חדש'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={form.handleSubmit(onSubmit)} className="p-1 hover:bg-gray-100 rounded text-[#00A896]" title="שמור"><Save className="w-5 h-5" /></button>
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded text-red-500" title="סגור"><X className="w-5 h-5" /></button>
                    )}
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-auto p-8 pt-6 content-start">
                <div className="space-y-8 w-full max-w-5xl mx-auto">
                    {/* Identification Section (Event 101/200) */}
                    {(!onlySections || onlySections.includes('identification')) && (
                        <div id="identification" className="space-y-3">
                            <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                                <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                                <h3 className="text-base font-bold text-blue-900 leading-none">נתוני זיהוי</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                                <FormRow label="מספר עובד">
                                    <Input {...form.register('employee_number')} className="h-7 text-sm bg-[#fdfdfd] border-slate-300 focus:border-blue-500 rounded-sm font-bold text-blue-800" />
                                </FormRow>
                                <FormRow label="תעודת זהות" required error={form.formState.errors.id_number?.message}>
                                    <Input {...form.register('id_number')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="תאריך לידה">
                                    <Input type="date" {...form.register('birth_date')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                            </div>
                        </div>
                    )}

                    {/* Personal Status Section (Event 104) */}
                    {(!onlySections || onlySections.includes('status')) && (
                        <div id="status" className="space-y-3">
                            <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                                <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                                <h3 className="text-base font-bold text-blue-900 leading-none">מצב אישי (אירוע 104)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                                <FormRow label="תאריך תוקף השינוי" required>
                                    <Input type="date" {...form.register('valid_from')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm font-bold" />
                                </FormRow>

                                <FormRow label="דרכון">
                                    <Input {...form.register('passport_number')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="ארץ לידה">
                                    <Input {...form.register('birth_country')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="לאום">
                                    <Input {...form.register('nationality')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="מגדר">
                                    <Select onValueChange={(val) => form.setValue('gender', val)} defaultValue={form.getValues('gender')}>
                                        <SelectTrigger className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm">
                                            <SelectValue placeholder="בחר" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">זכר</SelectItem>
                                            <SelectItem value="female">נקבה</SelectItem>
                                            <SelectItem value="unknown">לא ידוע</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormRow>
                                <FormRow label="מצב משפחתי">
                                    <Select onValueChange={(val) => form.setValue('marital_status', val)} defaultValue={form.getValues('marital_status')}>
                                        <SelectTrigger className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm">
                                            <SelectValue placeholder="בחר" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">רווק/ה</SelectItem>
                                            <SelectItem value="married">נשוי/ה</SelectItem>
                                            <SelectItem value="divorced">גרוש/ה</SelectItem>
                                            <SelectItem value="widowed">אלמן/ה</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormRow>
                            </div>
                        </div>
                    )}
                    {(!onlySections || onlySections.includes('names')) && (
                        <div id="names" className="space-y-3">
                            <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                                <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                                <h3 className="text-base font-bold text-blue-900 leading-none">שמות</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                                <FormRow label="שם פרטי" required error={form.formState.errors.first_name?.message}>
                                    <Input {...form.register('first_name')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="שם משפחה" required error={form.formState.errors.last_name?.message}>
                                    <Input {...form.register('last_name')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="שם משפחה קודם">
                                    <Input {...form.register('prev_last_name')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="שם פרטי קודם">
                                    <Input {...form.register('prev_first_name')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="שם פרטי (En)">
                                    <Input {...form.register('first_name_en')} dir="ltr" className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="שם משפחה (En)">
                                    <Input {...form.register('last_name_en')} dir="ltr" className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="שם נוסף">
                                    <Input {...form.register('additional_name')} className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                            </div>
                        </div>
                    )}

                    {/* Contact Section */}
                    {(!onlySections || onlySections.includes('contact')) && (
                        <div id="contact" className="space-y-3">
                            <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                                <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                                <h3 className="text-base font-bold text-blue-900 leading-none">פרטי התקשרות ומגורים</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                                <FormRow label="טלפון נייד">
                                    <Input {...form.register('mobile')} dir="ltr" className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="טלפון בבית">
                                    <Input {...form.register('phone')} dir="ltr" className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="דואר אלקטרוני">
                                    <Input type="email" {...form.register('email')} dir="ltr" className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="עיר / יישוב">
                                    <Input {...form.register('address_city')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="רחוב ומספר">
                                    <Input {...form.register('address_street')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="מיקוד">
                                    <Input {...form.register('address_zip')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                            </div>
                        </div>
                    )}

                    {/* Army Service Section */}
                    {(!onlySections || onlySections.includes('army')) && (
                        <div id="army" className="space-y-3">
                            <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                                <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                                <h3 className="text-base font-bold text-blue-900 leading-none">שירות צבאי</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                                <FormRow label="מעמד צבאי">
                                    <Select onValueChange={(val) => form.setValue('army_status', val)} defaultValue={form.getValues('army_status')}>
                                        <SelectTrigger className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm">
                                            <SelectValue placeholder="בחר" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="completed">שירות מלא</SelectItem>
                                            <SelectItem value="exempt">פטור</SelectItem>
                                            <SelectItem value="reserve">מילואים</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormRow>
                                <FormRow label="תאריך שחרור">
                                    <Input type="date" {...form.register('army_release_date')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                            </div>
                        </div>
                    )}

                    {/* Job Info Section */}
                    {((!initialData) || (onlySections && onlySections.includes('job'))) && (
                        <div id="job" className="space-y-3">
                            <div className="border-b border-blue-200 pb-1 mb-4 flex items-center gap-2">
                                <span className="h-4 w-1 bg-blue-600 rounded-full"></span>
                                <h3 className="text-base font-bold text-blue-900 leading-none">פרטי העסקה (אירוע 203)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3">
                                <FormRow label="תפקיד" required error={form.formState.errors.job_title?.message}>
                                    <Input {...form.register('job_title')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="מחלקה">
                                    <Input {...form.register('department')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="דירוג">
                                    <Input {...form.register('rank_id')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="דרגה">
                                    <Input {...form.register('grade_id')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm" />
                                </FormRow>
                                <FormRow label="סוג העסקה">
                                    <Select onValueChange={(val) => form.setValue('employment_type', val)} defaultValue={form.getValues('employment_type')}>
                                        <SelectTrigger className="h-7 text-sm bg-white border-slate-300 focus:border-blue-500 rounded-sm">
                                            <SelectValue placeholder="בחר" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_time">משרה מלאה</SelectItem>
                                            <SelectItem value="part_time">משרה חלקית</SelectItem>
                                            <SelectItem value="hourly">שעתי</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormRow>
                                <FormRow label="תאריך תחילת עבודה" required error={form.formState.errors.hire_date?.message}>
                                    <Input type="date" {...form.register('hire_date')} className="h-7 text-xs bg-white border-slate-300 focus:border-blue-500 rounded-sm font-bold" />
                                </FormRow>
                            </div>
                        </div>
                    )}
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
                        onClick={form.handleSubmit(onSubmit)}
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

/**
 * Dense Form Row with right-aligned label (Matching Hilan Label Style)
 */
function FormRow({ label, children, required, error }: { label: string; children: React.ReactNode; required?: boolean; error?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <Label className="w-32 text-right text-sm font-semibold text-slate-700 shrink-0 leading-tight">
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
