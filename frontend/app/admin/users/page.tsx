'use client'
import { useState, useEffect } from 'react'
import { Users, Search, Filter, Shield, Building2, Calendar, Mail, CheckCircle2, XCircle, Trash2, Edit2, Plus, X, Loader2, MoreVertical, Lock, Key } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import React from 'react'

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

import GlobalLoader from '@/components/ui/GlobalLoader'

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [orgFilter, setOrgFilter] = useState('')

  // Organizations for dropdown
  const [organizations, setOrganizations] = useState<Organization[]>([])

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

  // Form States
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

      const response = await fetch('http://localhost:8000/api/users', {
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
      const response = await fetch('http://localhost:8000/api/organizations', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (e) { console.error(e) }
  }

  const resetForm = () => {
    setFormData({ email: '', first_name: '', last_name: '', role: 'user', organization_id: '' })
    setSelectedUser(null)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:8000/api/users', {
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
      resetForm()
    } catch (error) {
      toast.error('שגיאה בהזמנת משתמש')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (user: UserData) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,

      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      role: mapRoleToValue(user.role),
      organization_id: user.organization_id || ''
    })
    setShowEditModal(true)
  }

  const mapRoleToValue = (displayRole: string) => {
    if (displayRole === 'Super Admin') return 'super_admin'
    if (displayRole === 'organization_admin' || displayRole === 'Org Admin') return 'organization_admin'
    return 'user'
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:8000/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          organization_id: formData.organization_id
        })
      })

      if (!response.ok) throw new Error('Failed')

      toast.success('פרטי משתמש עודכנו')
      setShowEditModal(false)
      fetchUsers()
      resetForm()
    } catch (error) {
      toast.error('שגיאה בעדכון משתמש')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה? פעולה זו אינה הפיכה.')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
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

      const response = await fetch(`http://localhost:8000/api/users/${userId}/reset-password`, {
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

  const filteredUsers = users.filter(user => {
    const fullName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.toLowerCase()
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter ? user.role === roleFilter : true
    const matchesOrg = orgFilter ? user.organization_name === orgFilter : true

    return matchesSearch && matchesRole && matchesOrg
  })

  // Get unique filters
  const uniqueOrgs = Array.from(new Set(users.map(u => u.organization_name))).filter(Boolean)
  const uniqueRoles = Array.from(new Set(users.map(u => u.role))).filter(Boolean)

  if (loading) {
    return <GlobalLoader />
  }

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
            onClick={() => { resetForm(); setShowInviteModal(true) }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            הזמן משתמש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 gap-4 flex flex-col md:flex-row justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, אימייל או ארגון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="relative min-w-[150px]">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full appearance-none pr-9 pl-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary cursor-pointer hover:bg-gray-50"
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
              >
                <option value="">כל הארגונים</option>
                {uniqueOrgs.map(org => <option key={org} value={org}>{org}</option>)}
              </select>
            </div>
            <div className="relative min-w-[150px]">
              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full appearance-none pr-9 pl-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary cursor-pointer hover:bg-gray-50"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">כל התפקידים</option>
                {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">משתמש</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ארגון</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">תפקיד</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">הצטרף ב</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer relative"
                    onClick={() => openEdit(user)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                            ${user.role === 'Super Admin' ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'}`}>
                          {(user.user_metadata?.first_name?.[0]) || user.email[0]?.toUpperCase()}
                        </div>
                        <div className="mr-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : 'משתמש ללא שם'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="w-4 h-4 ml-2 text-gray-400" />
                        {user.organization_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full items-center gap-1.5 border
                            ${user.role === 'Super Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          user.role === 'organization_admin' || user.role === 'Org Admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                        {user.role === 'Super Admin' && <Shield className="w-3 h-3 fill-current opacity-50" />}
                        {user.role === 'Super Admin' ? 'Super Admin' : (user.role === 'organization_admin' || user.role === 'Org Admin') ? 'Org Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{new Date(user.created_at).toLocaleDateString('he-IL')}</span>
                        <span className="text-xs text-gray-400">
                          {user.last_sign_in_at ? `נראה לאחרונה: ${new Date(user.last_sign_in_at).toLocaleDateString('he-IL')}` : 'טרם התחבר'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                          title="ערוך פרטים"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResetPassword(user.id); }}
                          className="p-1.5 hover:bg-amber-50 rounded-md text-gray-400 hover:text-amber-500 transition-all opacity-0 group-hover:opacity-100"
                          title="אפס סיסמה"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                          className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          title="מחק משתמש"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Search className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">לא נמצאו תוצאות</h3>
                      <p className="text-sm text-gray-400">נסה לשנות את מילות החיפוש או הסינון</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="הזמנת משתמש חדש">
        <UserForm
          data={formData}
          setData={setFormData}
          onSubmit={handleInvite}
          organizations={organizations}
          isSubmitting={isSubmitting}
          mode="create"
          onCancel={() => setShowInviteModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="עריכת משתמש">
        <UserForm
          data={formData}
          setData={setFormData}
          onSubmit={handleUpdate}
          organizations={organizations}
          isSubmitting={isSubmitting}
          mode="edit"
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  )
}

// Reusable Form Component
const UserForm = ({ data, setData, onSubmit, organizations, isSubmitting, mode, onCancel }: any) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-right" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי</label>
          <input
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={data.first_name}
            onChange={e => setData({ ...data, first_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה</label>
          <input
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={data.last_name}
            onChange={e => setData({ ...data, last_name: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">אימייל {mode === 'edit' && '(לקריאה בלבד)'}</label>
        <input
          required
          type="email"
          disabled={mode === 'edit'}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all ${mode === 'edit' ? 'bg-gray-100 text-gray-500' : ''}`}
          value={data.email}
          onChange={e => setData({ ...data, email: e.target.value })}
        />
      </div>



      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          הרשאות גישה
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד במערכת</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
              value={data.role}
              onChange={e => setData({ ...data, role: e.target.value })}
            >
              <option value="user">משתמש רגיל (User)</option>
              <option value="organization_admin">מנהל ארגון (Org Admin)</option>
              <option value="super_admin">מנהל מערכת (Super Admin)</option>
            </select>
          </div>

          {data.role !== 'super_admin' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">שיוך לארגון</label>
              <select
                required={data.role !== 'super_admin'}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                value={data.organization_id}
                onChange={e => setData({ ...data, organization_id: e.target.value })}
              >
                <option value="">בחר ארגון...</option>
                {organizations.map((org: Organization) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">ביטול</button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm hover:shadow transition-all"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'create' ? 'שלח הזמנה' : 'שמור שינויים'}
        </button>
      </div>
    </form>
  )
}
