'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

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
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel: () => void
}

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
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
        }
    })

    const onSubmit = async (data: EmployeeFormValues) => {
        if (!currentOrg) return

        setLoading(true)
        try {
            const employeeData = {
                ...data,
                organization_id: currentOrg.id,
                email: data.email || null, // Handle empty string as null
                phone: data.phone || null,
                mobile: data.mobile || null,
                first_name_en: data.first_name_en || null,
                last_name_en: data.last_name_en || null,
                employee_number: data.employee_number || null,
            }

            let response
            if (initialData) {
                response = await fetch(`/api/employees/${initialData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employeeData)
                })
            } else {
                response = await fetch('/api/employees', {
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="id_number">תעודת זהות *</Label>
                    <Input id="id_number" {...form.register('id_number')} />
                    {form.formState.errors.id_number && (
                        <p className="text-sm text-red-500">{form.formState.errors.id_number.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="employee_number">מספר עובד</Label>
                    <Input id="employee_number" {...form.register('employee_number')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="first_name">שם פרטי *</Label>
                    <Input id="first_name" {...form.register('first_name')} />
                    {form.formState.errors.first_name && (
                        <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name">שם משפחה *</Label>
                    <Input id="last_name" {...form.register('last_name')} />
                    {form.formState.errors.last_name && (
                        <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="first_name_en">שם פרטי (אנגלית)</Label>
                    <Input id="first_name_en" dir="ltr" {...form.register('first_name_en')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name_en">שם משפחה (אנגלית)</Label>
                    <Input id="last_name_en" dir="ltr" {...form.register('last_name_en')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gender">מגדר</Label>
                    <Select onValueChange={(val) => form.setValue('gender', val)} defaultValue={form.getValues('gender')}>
                        <SelectTrigger>
                            <SelectValue placeholder="בחר מגדר" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">זכר</SelectItem>
                            <SelectItem value="female">נקבה</SelectItem>
                            <SelectItem value="other">אחר</SelectItem>
                            <SelectItem value="unknown">לא ידוע</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <Input id="email" type="email" dir="ltr" {...form.register('email')} />
                    {form.formState.errors.email && (
                        <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mobile">נייד</Label>
                    <Input id="mobile" dir="ltr" {...form.register('mobile')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input id="phone" dir="ltr" {...form.register('phone')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="job_title">תפקיד *</Label>
                    <Input id="job_title" {...form.register('job_title')} />
                    {form.formState.errors.job_title && (
                        <p className="text-sm text-red-500">{form.formState.errors.job_title.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="employment_type">סוג העסקה</Label>
                    <Select onValueChange={(val) => form.setValue('employment_type', val)} defaultValue={form.getValues('employment_type')}>
                        <SelectTrigger>
                            <SelectValue placeholder="בחר סוג העסקה" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="full_time">משרה מלאה</SelectItem>
                            <SelectItem value="part_time">משרה חלקית</SelectItem>
                            <SelectItem value="hourly">שעתי</SelectItem>
                            <SelectItem value="contractor">קבלן</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="hire_date">תאריך תחילת עבודה *</Label>
                    <Input id="hire_date" type="date" {...form.register('hire_date')} />
                    {form.formState.errors.hire_date && (
                        <p className="text-sm text-red-500">{form.formState.errors.hire_date.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    ביטול
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'עדכן עובד' : 'צור עובד'}
                </Button>
            </div>
        </form>
    )
}
