'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { User, Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'

interface OrgUnit {
    id: string
    name: string
    type: string
    created_at: string
    parent?: {
        name: string
    } | null
    // manager?: {
    //     first_name: string
    //     last_name: string
    // } | null
}

export default function DepartmentsPage() {
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<OrgUnit[]>([])
    const [loading, setLoading] = useState(true)
    const hierarchyLevels = ['Wing', 'Department', 'Team']

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            // Simplified query - removed manager join
            const { data: units, error } = await supabase
                .from('org_units')
                .select('*, parent:org_units(name)')
                .eq('organization_id', currentOrg.id)
                .in('type', ['Department', 'מחלקה'])
                .order('name', { ascending: true })

            if (error) throw error
            setData(units as any || [])
        } catch (err) {
            console.error('Error fetching departments:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentOrg])

    const columns: ColumnDef<OrgUnit>[] = [
        {
            accessorKey: 'name',
            header: 'שם המחלקה',
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
        },
        {
            id: 'parent',
            header: 'שייך ל-',
            cell: ({ row }) => {
                const parent = row.original.parent
                return parent ? (
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{parent.name}</span>
                    </div>
                ) : <span className="text-gray-400">-</span>
            }
        },
        // {
        //     id: 'manager',
        //     header: 'מנהל',
        //     cell: ({ row }) => {
        //         const manager = row.original.manager
        //         return manager ? (
        //             <div className="flex items-center gap-2">
        //                 <User className="w-4 h-4 text-gray-400" />
        //                 <span>{manager.first_name} {manager.last_name}</span>
        //             </div>
        //         ) : <span className="text-gray-400">-</span>
        //     }
        // },
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

    if (loading) return <div className="p-8">טוען נתונים...</div>

    return (
        <div className="p-8" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">טבלת מחלקות</h1>
                    <p className="text-gray-500 mt-1">רשימת המחלקות בארגון.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/core/departments/new')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף מחלקה
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
                onRowClick={(row) => router.push(`/dashboard/core/departments/${row.id}`)}
            />
        </div>
    )
}
