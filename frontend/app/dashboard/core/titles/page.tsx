'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, Briefcase, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { JobTitleForm } from '@/components/core/JobTitleForm'
import toast from 'react-hot-toast'

interface JobTitle {
    id: string
    title: string
    job_number: string
    default_grade_id: string
    created_at: string
    job_grades: {
        name: string
        level: number
    }
}

export default function JobTitlesPage() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<JobTitle[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('job_titles')
                .select('*, job_grades(name, level)')
                .eq('organization_id', currentOrg.id)
                .order('title', { ascending: true })

            if (error) throw error
            setData(data || [])

        } catch (err) {
            console.error('Error fetching titles:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentOrg])



    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח?')) return
        try {
            const { error } = await supabase.from('job_titles').delete().eq('id', id)
            if (error) throw error
            toast.success('נמחק בהצלחה')
            fetchData()
        } catch (err) {
            console.error(err)
            toast.error('שגיאה במחיקה')
        }
    }

    const columns: ColumnDef<JobTitle>[] = [
        {
            accessorKey: 'job_number',
            header: "מס' תפקיד",
            size: 100,
            cell: ({ getValue }) => <div className="font-mono text-gray-600">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'title',
            header: 'שם התפקיד',
            cell: ({ getValue }) => (
                <div className="flex items-center gap-2 font-medium">
                    <Briefcase className="w-4 h-4 text-[#00A896]/60" />
                    <span>{getValue() as string}</span>
                </div>
            )
        },
        {
            id: 'grade',
            header: 'דירוג ברירת מחדל',
            cell: ({ row }) => {
                const gradeData = (row.original as any).job_grades
                const grade = Array.isArray(gradeData) ? gradeData[0] : gradeData
                return grade ? (
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500/60" />
                        <span className="text-gray-700">{grade.name} ({grade.level})</span>
                    </div>
                ) : <span className="text-gray-400 italic text-xs">ללא דירוג</span>
            }
        },
        {
            accessorKey: 'created_at',
            header: 'נוצר בתאריך',
            cell: ({ getValue }) => format(new Date(getValue() as string), 'dd/MM/yyyy')
        },
        {
            accessorKey: 'effective_date',
            header: 'תאריך תחולה',
            cell: ({ getValue }) => getValue() ? format(new Date(getValue() as string), 'dd/MM/yyyy') : '-'
        },
        {
            accessorKey: 'expiry_date',
            header: 'גמר תוקף',
            cell: ({ getValue }) => getValue() ? format(new Date(getValue() as string), 'dd/MM/yyyy') : <span className="text-gray-400">ללא</span>
        }
    ]

    return (
        <div className="p-8 space-y-8" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">טבלת תפקידים</h1>
                    <p className="text-gray-500 mt-1">קטלוג משרות בסיסי.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/core/titles/new')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף תפקיד
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
                onRowClick={(row) => router.push(`/dashboard/core/titles/${row.id}`)}
            />
        </div>
    )
}
