'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { JobTitleForm } from '@/components/core/JobTitleForm'
import { Plus } from 'lucide-react'

interface Role {
    id: string
    title: string
    default_grade_id: string | null
    created_at: string
    grade?: {
        name: string
        level: number
    }
}

export default function RolesPage() {
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            // Simplified query - removed grade join just in case, or keep it?
            // User said "Role depends on Dept" but job_titles are global usually.
            // Let's keep grade join for now, if it breaks I'll remove it.
            // Actually, if Wings/Dept failed due to employees join, this might fail due to grade join if RLS issues.
            // But let's try to remove it to be safe and ensure loading.

            const { data: roles, error } = await supabase
                .from('job_titles')
                .select('*') // Removed join: grade:job_grades(name, level)
                .eq('organization_id', currentOrg.id)
                .order('title', { ascending: true })

            if (error) throw error
            setData(roles || [])
        } catch (err) {
            console.error('Error fetching roles:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentOrg])

    const columns: ColumnDef<Role>[] = [
        {
            accessorKey: 'title',
            header: 'שם התפקיד',
        },
        // {
        //     accessorKey: 'grade.name',
        //     header: 'דירוג ברירת מחדל',
        //     cell: ({ row }) => {
        //         const grade = row.original.grade
        //         return grade ? `${grade.name} (${grade.level})` : '-'
        //     }
        // },
        {
            accessorKey: 'created_at',
            header: 'נוצר בתאריך',
            cell: ({ getValue }) => format(new Date(getValue() as string), 'dd/MM/yyyy')
        }
    ]

    if (loading) return <div className="p-8">טוען נתונים...</div>

    return (
        <div className="p-8" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">טבלת תפקידים</h1>
                    <p className="text-gray-500 mt-1">רשימת כל התפקידים המוגדרים בארגון.</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף תפקיד
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
            />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                <JobTitleForm
                    onSuccess={() => {
                        setShowModal(false)
                        fetchData()
                    }}
                    onCancel={() => setShowModal(false)}
                />
            </Modal>
        </div>
    )
}
