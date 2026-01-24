'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { User, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'

interface OrgUnit {
    id: string
    unit_number: string
    name: string
    type: string
    created_at: string
    // manager?: {
    //     first_name: string
    //     last_name: string
    // } | null
}

export default function WingsPage() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<OrgUnit[]>([])
    const [loading, setLoading] = useState(true)
    const hierarchyLevels = ['Wing', 'Department', 'Team']

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            // Removed join to debug loading issue
            const { data: units, error } = await supabase
                .from('org_units')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .in('type', ['Wing', 'אגף'])
                .in('type', ['Wing', 'אגף'])
                .order('unit_number', { ascending: true })
                .order('name', { ascending: true })

            if (error) throw error
            setData(units || [])
        } catch (err) {
            console.error('Error fetching wings:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentOrg])

    const columns: ColumnDef<OrgUnit>[] = [
        {
            accessorKey: 'unit_number',
            header: "מס' אגף",
            cell: ({ getValue }) => <div className="font-mono text-gray-600">{getValue() as string || '-'}</div>,
            size: 100
        },
        {
            accessorKey: 'name',
            header: 'שם האגף',
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
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
                    <h1 className="text-3xl font-bold">טבלת אגפים</h1>
                    <p className="text-gray-500 mt-1">רשימת האגפים בארגון.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/core/wings/new')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף אגף
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
                onRowClick={(row) => router.push(`/dashboard/core/wings/${row.id}`)}
            />
        </div>
    )
}
