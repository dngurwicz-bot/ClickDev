'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import GlobalLoader from '@/components/ui/GlobalLoader'
import DataTable from '@/components/DataTable'
import ExportModal from '@/components/ExportModal'
import { ColumnDef } from '@tanstack/react-table'
import { FacetedFilter } from '@/components/FacetedFilter'
import toast from 'react-hot-toast'

interface Organization {
  id: string
  org_number?: string
  name: string
  name_en?: string
  email: string
  phone?: string
  subscription_tier: string
  is_active: boolean
  active_modules: string[]
  created_at: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const [showExportModal, setShowExportModal] = useState(false)

  const exportToExcel = (type: 'all' | 'filtered' | 'custom' = 'all', customCount?: number) => {
    try {
      const XLSX = require('xlsx')

      let dataToExport = type === 'all' ? organizations : organizations.slice(0, customCount || organizations.length)

      const excelData = dataToExport.map(org => ({
        'מספר ארגון': org.org_number || '',
        'שם הארגון': org.name,
        'שם באנגלית': org.name_en || '',
        'אימייל': org.email,
        'טלפון': org.phone || '',
        'מנוי': org.subscription_tier,
        'סטטוס': org.is_active ? 'פעיל' : 'לא פעיל',
        'מודולים פעילים': org.active_modules?.length || 0,
        'תאריך יצירה': new Date(org.created_at).toLocaleDateString('he-IL'),
        'שעה': new Date(org.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'ארגונים')
      XLSX.writeFile(wb, `ארגונים_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.xlsx`)

      toast.success(`${dataToExport.length} ארגונים יוצאו בהצלחה!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('שגיאה ביצוא הקובץ')
    }
  }

  // Define columns for DataTable
  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: 'org_number',
      header: 'מספר ארגון',
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'name',
      header: 'שם הארגון',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#00A896]/60" />
          <div className="font-medium text-text-primary">{row.original.name}</div>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'email',
      header: 'אימייל',
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'phone',
      header: 'טלפון',
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'subscription_tier',
      header: 'מנוי',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#E0F5F3] text-[#00A896]">
          {row.original.subscription_tier}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return (value as string[]).includes(row.getValue(id))
      },
      meta: {
        filterVariant: 'select',
      },
    },
    {
      accessorKey: 'is_active',
      header: 'סטטוס',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {row.original.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return (value as string[]).includes((row.getValue(id) as boolean).toString())
      },
      meta: {
        filterVariant: 'select',
        filterOptions: [
          { label: 'פעיל', value: 'true' },
          { label: 'לא פעיל', value: 'false' },
        ],
      },
    },
    {
      accessorKey: 'created_at',
      header: 'תאריך יצירה',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{new Date(row.original.created_at).toLocaleDateString('he-IL')}</div>
          <div className="text-xs text-gray-500">
            {new Date(row.original.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      id: 'actions',
      header: 'פעולות',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/organizations/${row.original.id}`);
          }}
          className="text-[#00A896] hover:text-[#008f80] font-bold text-xs underline"
        >
          {'פרטים >>'}
        </button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.org_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <GlobalLoader />
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">ארגונים</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            יצוא לאקסל
          </button>
          <Link
            href="/admin/organizations/new"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>ארגון חדש</span>
          </Link>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={organizations}
        onRowClick={(org) => router.push(`/admin/organizations/${org.id}`)}
      />

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={(type, customCount) => exportToExcel(type, customCount)}
          totalCount={organizations.length}
          filteredCount={organizations.length}
          hasFilters={false}
        />
      )}
    </div>
  )
}


