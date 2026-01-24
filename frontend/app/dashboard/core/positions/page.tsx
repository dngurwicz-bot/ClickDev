'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { User, Plus, Briefcase, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PositionForm } from '@/components/core/PositionForm'

interface Position {
    id: string
    organization_id: string
    org_unit_id: string
    job_title_id: string
    is_manager_position: boolean
    created_at: string
    org_unit?: { name: string; type: string }
    job_title?: { title: string }
}

export default function PositionsPage() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [data, setData] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            // Fetch positions with joins
            const { data: positions, error } = await supabase
                .from('positions')
                .select('*, org_unit:org_units(name, type), job_title:job_titles(title)')
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setData(positions as any[] || [])
        } catch (err) {
            console.error('Error fetching positions:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [currentOrg])

    const columns: ColumnDef<Position>[] = [
        {
            id: 'job_title',
            header: 'תפקיד (קטלוג)',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 font-medium">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    {row.original.job_title?.title || 'ללא תפקיד'}
                </div>
            )
        },
        {
            id: 'org_unit',
            header: 'שיוך ארגוני',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Network className="w-4 h-4 text-gray-400" />
                    {row.original.org_unit?.name} ({row.original.org_unit?.type})
                </div>
            )
        },
        {
            accessorKey: 'is_manager_position',
            header: 'תקן ניהולי',
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getValue() ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {getValue() ? 'כן' : 'לא'}
                </span>
            )
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

    if (loading) return <div className="p-8">טוען נתונים...</div>

    return (
        <div className="p-8" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">תקנים בארגון</h1>
                    <p className="text-gray-500 mt-1">ניהול המשרות המאוישות והפנויות בחלוקה ליחידות ארגוניות.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/core/positions/new')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף תקן
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                showSearch={true}
                onRowClick={(row) => router.push(`/dashboard/core/positions/${row.id}`)}
            />
        </div>
    )
}
