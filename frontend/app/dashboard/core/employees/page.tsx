'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { User, Plus, Mail, Phone, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface Employee {
    id: string
    organization_id: string
    first_name: string
    last_name: string
    email: string | null
    job_title: string
    phone: string | null
    mobile: string | null
    hire_date: string
    employee_number: string | null
    created_at: string
}

export default function EmployeesPage() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            const { data: employees, error } = await supabase
                .from('employees')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('first_name', { ascending: true })

            if (error) throw error
            setData(employees as Employee[] || [])
        } catch (err) {
            console.error('Error fetching employees:', err)
            toast.error('שגיאה בטעינת עובדים')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [currentOrg])

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) return

        try {
            const response = await fetch(`/api/employees/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete')

            toast.success('העובד נמחק בהצלחה')
            fetchData()
        } catch (error) {
            toast.error('שגיאה במחיקת העובד')
        }
    }

    const columns: ColumnDef<Employee>[] = [
        {
            accessorKey: 'full_name',
            header: 'שם מלא',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 font-medium cursor-pointer hover:underline text-blue-600" onClick={() => {
                    router.push(`/dashboard/core/employees/${row.original.id}`)
                }}>
                    <div className="bg-primary/10 p-2 rounded-full">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    {row.original.first_name} {row.original.last_name}
                </div>
            )
        },
        {
            accessorKey: 'job_title',
            header: 'תפקיד',
            cell: ({ getValue }) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    {getValue() as string}
                </div>
            )
        },
        {
            accessorKey: 'contact',
            header: 'קשר',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 text-xs">
                    {row.original.email && (
                        <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {row.original.email}
                        </div>
                    )}
                    {row.original.mobile && (
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {row.original.mobile}
                        </div>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'employee_number',
            header: 'מספר עובד',
            cell: ({ getValue }) => getValue() || '-'
        },
        {
            accessorKey: 'hire_date',
            header: 'תאריך תחילת עבודה',
            cell: ({ getValue }) => getValue() ? format(new Date(getValue() as string), 'dd/MM/yyyy') : '-'
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(row.original.id)
                }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    מחק
                </Button>
            )
        }
    ]

    if (loading) return <div className="p-8">טוען נתונים...</div>

    return (
        <div className="p-8" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">ניהול עובדים</h1>
                    <p className="text-gray-500 mt-1">רשימת כל העובדים בארגון, ניהול תיקים ופרטים אישיים.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/core/employees/new')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף עובד
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
            />
        </div>
    )

}
