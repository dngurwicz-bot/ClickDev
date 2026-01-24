'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Search, Shield, Building2, Calendar, Plus, X, Loader2, Lock, Trash2, Edit2, Key } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import React from 'react'
import GlobalLoader from '@/components/ui/GlobalLoader'
import DataTable from '@/components/DataTable'
import ExportModal from '@/components/ExportModal'
import { ColumnDef } from '@tanstack/react-table'

interface UserData {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  role: string
  organization_name: string
  organization_id: string
  user_metadata: any
}

interface Organization {
  id: string
  name: string
}

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    organization_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchOrganizations()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      toast.error('שגיאה בטעינת משתמשים')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const response = await fetch('/api/organizations', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (e) { console.error(e) }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed')

      toast.success('משתמש הוזמן בהצלחה')
      setShowInviteModal(false)
      fetchUsers()
      setFormData({ email: '', first_name: '', last_name: '', role: 'user', organization_id: '' })
    } catch (error) {
      toast.error('שגיאה בהזמנת משתמש')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה? פעולה זו אינה הפיכה.')) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        toast.success('משתמש נמחק')
        setUsers(users.filter(u => u.id !== userId))
      } else {
        toast.error('שגיאה במחיקה')
      }
    } catch (error) {
      toast.error('שגיאה במחיקה')
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm('האם לשלוח מייל לאיפוס סיסמה למשתמש זה?')) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        toast.success('מייל לאיפוס סיסמה נשלח בהצלחה')
      } else {
        toast.error('שגיאה בשליחת המייל')
      }
    } catch (error) {
      toast.error('שגיאה בשליחת המייל')
    }
  }

  const exportToExcel = (type: 'all' | 'filtered' | 'custom' = 'all', customCount?: number) => {
    try {
      const XLSX = require('xlsx')
      let dataToExport = type === 'all' ? users : users.slice(0, customCount || users.length)

      const excelData = dataToExport.map(user => ({
        'שם פרטי': user.user_metadata?.first_name || '',
        'שם משפחה': user.user_metadata?.last_name || '',
        'אימייל': user.email,
        'תפקיד': user.role === 'admin' ? 'אדמין' : 'משתמש',
        'ארגון': user.organization_name || '-',
        'תאריך הצטרפות': new Date(user.created_at).toLocaleDateString('he-IL'),
        'כניסה אחרונה': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('he-IL') : '-'
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      XLSX.utils.book_append_sheet(wb, ws, 'משתמשים')
      XLSX.writeFile(wb, `משתמשים_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.xlsx`)
      toast.success(`${dataToExport.length} משתמשים יוצאו בהצלחה!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('שגיאה ביצוא הקובץ')
    }
  }

  const columns: ColumnDef<UserData>[] = [
    {
      accessorFn: (row) => `${row.user_metadata?.first_name || ''} ${row.user_metadata?.last_name || ''}`,
      id: 'fullName',
      header: 'שם מלא',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E0F5F3] flex items-center justify-center text-[#00A896] font-bold text-[10px] shrink-0">
            {row.original.user_metadata?.first_name?.[0] || row.original.email[0].toUpperCase()}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-medium text-text-primary text-xs">
              {row.original.user_metadata?.first_name} {row.original.user_metadata?.last_name}
            </span>
          </div>
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
      accessorKey: 'role',
      header: 'תפקיד',
      cell: ({ row }) => {
        const role = row.original.role
        let colorClass = 'bg-gray-100 text-gray-800'
        let icon = <Users className="w-3 h-3 ml-1" />
        let label = 'משתמש'

        switch (role) {
          case 'super_admin':
            colorClass = 'bg-purple-100 text-purple-800'
            icon = <Shield className="w-3 h-3 ml-1" />
            label = 'Super Admin'
            break
          case 'organization_admin':
            colorClass = 'bg-indigo-100 text-indigo-800'
            icon = <Building2 className="w-3 h-3 ml-1" />
            label = 'מנהל ארגון'
            break
          case 'manager':
            colorClass = 'bg-blue-100 text-blue-800'
            icon = <Shield className="w-3 h-3 ml-1" />
            label = 'מנהל'
            break
          case 'employee':
            colorClass = 'bg-green-100 text-green-800'
            icon = <Users className="w-3 h-3 ml-1" />
            label = 'עובד'
            break
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {icon} {label}
          </span>
        )
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
      meta: {
        filterVariant: 'select',
        filterOptions: [
          { label: 'Super Admin', value: 'super_admin' },
          { label: 'מנהל ארגון', value: 'organization_admin' },
          { label: 'מנהל', value: 'manager' },
          { label: 'עובד', value: 'employee' },
          { label: 'משתמש', value: 'user' },
        ],
      },
    },
    {
      accessorKey: 'organization_name',
      header: 'ארגון',
      cell: ({ row }) => (
        <div className="flex items-center text-xs text-gray-700">
          <Building2 className="w-3.5 h-3.5 ml-1.5 text-[#00A896]/50" />
          <span className="truncate">{row.original.organization_name || '-'}</span>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
      meta: {
        filterVariant: 'select',
        filterOptions: organizations.map(org => ({ label: org.name, value: org.name })),
      },
    },
    {
      accessorKey: 'created_at',
      header: 'הצטרף',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('he-IL'),
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      id: 'actions',
      header: 'פעולות',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => handleResetPassword(row.original.id)}
            className="p-1 hover:bg-[#E0F5F3] rounded text-[#00A896] transition-colors"
            title="אפס סיסמה"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
            title="מחק"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  if (loading) return <GlobalLoader />

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">ניהול משתמשים</h1>
          <p className="text-gray-500 mt-1">צפייה, עריכה וניהול הרשאות משתמשים במערכת</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-500 shadow-sm items-center border border-gray-100">
            <Users className="w-5 h-5 ml-2 text-primary" />
            <span>סה״כ: {users.length}</span>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            יצוא לאקסל
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            הזמן משתמש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={users} onRowClick={(user) => window.location.href = `/admin/users/${user.id}`} />
      </div>

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={exportToExcel}
          totalCount={users.length}
          filteredCount={users.length} // DataTable handles filtering internally, so just pass full count or implement external filtering if needed (for now simple)
          hasFilters={false}
        />
      )}

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="הזמנת משתמש חדש">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי</label>
              <input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה</label>
              <input type="text" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
              <option value="user">משתמש</option>
              <option value="organization_admin">מנהל ארגון</option>
              <option value="super_admin">אדמין</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ארגון</label>
            <select required value={formData.organization_id} onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
              <option value="">בחר ארגון...</option>
              {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-gray-600">ביטול</button>
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2 rounded-lg">{isSubmitting ? <Loader2 className="animate-spin" /> : 'שלח'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
