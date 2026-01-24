'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2, Award, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { JobGradeForm } from '@/components/core/JobGradeForm'
import toast from 'react-hot-toast'

interface JobGrade {
    id: string
    name: string
    level: number
    created_at: string
}

export default function JobGradesPage() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<JobGrade[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('job_grades')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('level', { ascending: true })

            if (error) throw error
            setData(data || [])
        } catch (err) {
            console.error('Error fetching grades:', err)
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
            const { error } = await supabase.from('job_grades').delete().eq('id', id)
            if (error) throw error
            toast.success('נמחק בהצלחה')
            fetchData()
        } catch (err) {
            console.error(err)
            toast.error('שגיאה במחיקה')
        }
    }

    const columns: ColumnDef<JobGrade>[] = [
        {
            accessorKey: 'level',
            header: 'רמה',
            size: 80,
            cell: ({ getValue }) => (
                <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#00A896]/60" />
                    <span className="font-mono font-bold text-[#00A896] bg-[#E0F5F3] px-2 py-0.5 rounded text-xs">{getValue() as number}</span>
                </div>
            )
        },
        {
            accessorKey: 'name',
            header: 'שם הדירוג',
            cell: ({ getValue }) => <div className="font-medium">{getValue() as string}</div>
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
                    <h1 className="text-3xl font-bold">דירוגי תפקיד</h1>
                    <p className="text-gray-500 mt-1">ניהול רמות שכר ודרגות בארגון.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/core/grades/new')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף דירוג
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
                onRowClick={(row) => router.push(`/dashboard/core/grades/${row.id}`)}
            />
        </div>
    )
}
