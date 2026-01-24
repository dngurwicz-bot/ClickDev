'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

const jobTitleSchema = z.object({
    title: z.string().min(2, 'שם התפקיד חייב להכיל לפחות 2 תווים'),
    default_grade_id: z.string().nullable().optional(),
})

type JobTitleFormValues = z.infer<typeof jobTitleSchema>

interface JobTitleFormProps {
    initialData?: {
        id: string
        title: string
        default_grade_id: string | null
    }
    onSuccess: () => void
    onCancel: () => void
}

export function JobTitleForm({ initialData, onSuccess, onCancel }: JobTitleFormProps) {
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [grades, setGrades] = useState<{ id: string, name: string, level: number }[]>([])

    useEffect(() => {
        if (!currentOrg) return
        supabase.from('job_grades').select('*').eq('organization_id', currentOrg.id).order('level')
            .then(({ data }) => setGrades(data || []))
    }, [currentOrg])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JobTitleFormValues>({
        resolver: zodResolver(jobTitleSchema),
        defaultValues: {
            title: initialData?.title || '',
            default_grade_id: initialData?.default_grade_id || '',
        },
    })

    const onSubmit = async (data: JobTitleFormValues) => {
        if (!currentOrg) return
        setLoading(true)

        try {
            const payload = {
                organization_id: currentOrg.id,
                title: data.title,
                default_grade_id: data.default_grade_id || null
            }

            if (initialData) {
                const { error } = await supabase
                    .from('job_titles')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('job_titles').insert(payload)
                if (error) throw error
            }
            onSuccess()
        } catch (error) {
            console.error('Error saving job title:', error)
            alert('שגיאה בשמירת התפקיד')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6 w-full max-w-md mx-auto shadow-none border-0">
            <h2 className="text-xl font-bold mb-4">{initialData ? 'ערוך תפקיד' : 'הוסף תפקיד'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">שם התפקיד</label>
                    <Input {...register('title')} placeholder="לדוגמה: מפתח תוכנה" />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">דירוג ברירת מחדל</label>
                    <select
                        {...register('default_grade_id')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">בחר דירוג...</option>
                        {grades.map(g => (
                            <option key={g.id} value={g.id}>{g.name} (רמה {g.level})</option>
                        ))}
                    </select>
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
