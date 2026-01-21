'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowRight, Building2, Mail, Phone, MapPin, Send, CheckCircle2, XCircle,
  Users, Settings, Package, Edit, Trash2, Plus, Save, X, Globe, FileText,
  AlertTriangle, Loader2, Upload, Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import GlobalLoader from '@/components/ui/GlobalLoader'

interface Organization {
  id: string
  org_number?: string
  name: string
  name_en?: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  website?: string
  tax_id?: string
  business_number?: string
  logo_url?: string
  active_modules: string[]
  subscription_tier: string
  subscription_tier_id?: string
  is_active: boolean
  created_at: string
  notes?: string
}

interface AdminUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

interface OrganizationUser {
  id: string
  user_id: string
  role: string
  email?: string
  first_name?: string
  last_name?: string
  created_at: string
}

type TabType = 'details' | 'users' | 'modules' | 'settings'

const AVAILABLE_MODULES = [
  { id: 'core', name: 'ליבה', nameEn: 'Core' },
  { id: 'flow', name: 'Flow', nameEn: 'Flow' },
  { id: 'docs', name: 'מסמכים', nameEn: 'Documents' },
  { id: 'vision', name: 'Vision', nameEn: 'Vision' },
  { id: 'assets', name: 'נכסים', nameEn: 'Assets' },
  { id: 'vibe', name: 'Vibe', nameEn: 'Vibe' },
  { id: 'grow', name: 'Grow', nameEn: 'Grow' },
  { id: 'insights', name: 'Insights', nameEn: 'Insights' },
]

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.id as string

  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([])
  const [subscriptionTiers, setSubscriptionTiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [error, setError] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const file = event.target.files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('הקובץ חייב להיות תמונה')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('גודל התמונה חייב להיות קטן מ-2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${orgId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', orgId)

      if (updateError) throw updateError

      setOrganization(prev => prev ? { ...prev, logo_url: publicUrl } : null)
      setEditForm(prev => ({ ...prev, logo_url: publicUrl }))
      toast.success('הלוגו עודכן בהצלחה')
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      toast.error('שגיאה בהעלאת הלוגו')
    } finally {
      setUploadingLogo(false)
    }
  }

  const [editForm, setEditForm] = useState<Partial<Organization>>({})
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'manager' as 'organization_admin' | 'manager' | 'employee',
  })

  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    role: 'manager' as 'organization_admin' | 'manager' | 'employee',
  })

  useEffect(() => {
    fetchData()
  }, [orgId])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchOrganization(),
        fetchAdminUser(),
        fetchOrganizationUsers(),
        fetchSubscriptionTiers(),
      ])
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganization = async () => {
    try {
      // Try direct Supabase query first
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (orgError) {
        // If RLS blocks access, use API route with service role
        if (orgError.code === '42501' || orgError.message?.includes('permission denied')) {
          console.log('RLS blocked access, trying via API route...')
          const response = await fetch(`/api/organizations/${orgId}`)
          if (response.ok) {
            const orgData = await response.json()
            setOrganization(orgData)
            setEditForm(orgData)
            return
          }
        }
        throw orgError
      }
      setOrganization(org)
      setEditForm(org)
    } catch (err: any) {
      console.error('Error fetching organization:', err)
      throw err
    }
  }

  const fetchAdminUser = async () => {
    try {
      const adminResponse = await fetch(`/api/organizations/${orgId}/admin`)
      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        setAdminUser(adminData)
      } else if (adminResponse.status === 404) {
        // Admin user might not exist, that's okay
        console.log('Admin user not found for organization - this is normal if no admin was assigned')
      }
    } catch (err) {
      // Silently fail - admin user is optional
      console.log('Could not fetch admin user:', err)
    }
  }

  const fetchOrganizationUsers = async () => {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('organization_id', orgId)

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    // Fetch user details for each role
    const usersWithDetails = await Promise.all(
      (userRoles || []).map(async (role) => {
        try {
          const response = await fetch(`/api/users/${role.user_id}`)
          if (response.ok) {
            const userData = await response.json()
            return {
              ...role,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
            }
          }
          return role
        } catch {
          return role
        }
      })
    )

    setOrganizationUsers(usersWithDetails)
  }

  const filteredUsers = organizationUsers.filter(user => {
    const searchLower = userSearchTerm.toLowerCase()
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    )
  })

  const fetchSubscriptionTiers = async () => {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (!error) {
      setSubscriptionTiers(data || [])
    }
  }

  const handleSave = async () => {
    if (!organization) return

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          ...editForm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)

      if (updateError) throw updateError

      toast.success('הארגון עודכן בהצלחה!')
      setEditing(false)
      await fetchOrganization()
    } catch (err: any) {
      console.error('Error updating organization:', err)
      setError(err.message || 'שגיאה בעדכון הארגון')
      toast.error('שגיאה בעדכון הארגון')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הארגון הזה? פעולה זו לא ניתנת לביטול!')) {
      return
    }

    if (!confirm('זה ימחק את כל הנתונים הקשורים לארגון. האם אתה בטוח?')) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      // Use API route with service role to bypass RLS
      const response = await fetch(`/api/organizations/${orgId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        let errorMessage = errorData.error || 'שגיאה במחיקת הארגון'

        // Translate common errors to Hebrew
        if (errorMessage.includes('Invalid API key') || errorMessage.includes('API key')) {
          errorMessage = 'שגיאת הגדרת שרת: מפתח API לא תקין. אנא פנה למנהל המערכת.'
        } else if (errorMessage.includes('Missing Supabase credentials')) {
          errorMessage = 'שגיאת הגדרת שרת: חסרים פרטי התחברות. אנא פנה למנהל המערכת.'
        } else if (errorMessage.includes('permission denied')) {
          errorMessage = 'אין הרשאה למחוק את הארגון. אנא פנה למנהל המערכת.'
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      toast.success('הארגון נמחק בהצלחה')
      router.push('/admin/organizations')
    } catch (err: any) {
      console.error('Error deleting organization:', err)
      const errorMessage = err.message || 'שגיאה במחיקת הארגון'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.firstName || !newUserForm.lastName) {
      setError('יש למלא את כל השדות')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/organizations/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          organizationId: orgId,
          userData: newUserForm,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add user')
      }

      toast.success('משתמש נוסף בהצלחה!')
      setShowAddUser(false)
      setNewUserForm({ email: '', firstName: '', lastName: '', role: 'manager' })
      await fetchOrganizationUsers()
    } catch (err: any) {
      console.error('Error adding user:', err)
      setError(err.message || 'שגיאה בהוספת המשתמש')
      toast.error(err.message || 'שגיאה בהוספת המשתמש')
    } finally {
      setSaving(false)
    }
  }

  const handleSendInvite = async (email: string) => {
    setSendingEmail(true)
    setError('')

    try {
      const response = await fetch(`/api/organizations/${orgId}/send-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      toast.success('מייל הזמנה נשלח בהצלחה!')
    } catch (err: any) {
      console.error('Error sending invite:', err)
      setError(err.message || 'שגיאה בשליחת המייל')
      toast.error(err.message || 'שגיאה בשליחת המייל')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser || !editUserForm.firstName || !editUserForm.lastName) {
      setError('יש למלא את כל השדות')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`/api/users/${editingUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          firstName: editUserForm.firstName,
          lastName: editUserForm.lastName,
          role: editUserForm.role,
          organizationId: orgId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      toast.success('פרטי המשתמש עודכנו בהצלחה!')
      setEditingUser(null)
      await fetchOrganizationUsers()
    } catch (err: any) {
      console.error('Error updating user:', err)
      setError(err.message || 'שגיאה בעדכון המשתמש')
      toast.error(err.message || 'שגיאה בעדכון המשתמש')
    } finally {
      setSaving(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    if (moduleId === 'core') return // Core is always active

    setEditForm(prev => ({
      ...prev,
      active_modules: prev.active_modules?.includes(moduleId)
        ? prev.active_modules.filter(id => id !== moduleId)
        : [...(prev.active_modules || []), moduleId]
    }))
  }

  if (loading) {
    return <GlobalLoader />
  }

  if (!organization) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'ארגון לא נמצא'}
        </div>
      </div>
    )
  }

  const moduleNames: Record<string, string> = {
    core: 'ליבה',
    flow: 'Flow',
    docs: 'מסמכים',
    vision: 'Vision',
    assets: 'נכסים',
    vibe: 'Vibe',
    grow: 'Grow',
    insights: 'Insights',
  }

  const tabs = [
    { id: 'details' as TabType, label: 'פרטים', icon: Building2 },
    { id: 'users' as TabType, label: 'משתמשים', icon: Users },
    { id: 'modules' as TabType, label: 'מודולים', icon: Package },
    { id: 'settings' as TabType, label: 'הגדרות', icon: Settings },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/organizations')}
          className="text-text-secondary hover:text-text-primary mb-4 flex items-center gap-2 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימת ארגונים
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{organization.name}</h1>
            {organization.name_en && (
              <p className="text-text-secondary mt-1">{organization.name_en}</p>
            )}
            {organization.org_number && (
              <p className="text-sm text-text-muted mt-1">
                מספר ארגון: <span className="font-mono font-semibold text-primary">{organization.org_number}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${organization.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {organization.is_active ? 'פעיל' : 'לא פעיל'}
            </div>
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  ערוך
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  מחק
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                      ? 'border-primary text-primary bg-primary-light'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {editing ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-primary">עריכת פרטי הארגון</h2>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditing(false)
                          setEditForm(organization)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-text-primary hover:bg-gray-50"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            שומר...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            שמור
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        שם הארגון (עברית) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        שם הארגון (אנגלית)
                      </label>
                      <input
                        type="text"
                        value={editForm.name_en || ''}
                        onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Mail className="inline w-4 h-4 ml-1" />
                        אימייל <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Phone className="inline w-4 h-4 ml-1" />
                        טלפון
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        חפ/מספר עוסק מורש
                      </label>
                      <input
                        type="text"
                        value={editForm.tax_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, tax_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="לדוגמה: 123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        מספר עסק
                      </label>
                      <input
                        type="text"
                        value={editForm.business_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, business_number: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <MapPin className="inline w-4 h-4 ml-1" />
                        כתובת
                      </label>
                      <input
                        type="text"
                        value={editForm.address || ''}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="רחוב ומספר בית"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        עיר
                      </label>
                      <input
                        type="text"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        מיקוד
                      </label>
                      <input
                        type="text"
                        value={editForm.postal_code || ''}
                        onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        מדינה
                      </label>
                      <input
                        type="text"
                        value={editForm.country || 'ישראל'}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Globe className="inline w-4 h-4 ml-1" />
                        אתר אינטרנט
                      </label>
                      <input
                        type="url"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <FileText className="inline w-4 h-4 ml-1" />
                        הערות
                      </label>
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={4}
                        placeholder="הערות נוספות על הארגון..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        סוג מנוי
                      </label>
                      <select
                        value={editForm.subscription_tier_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, subscription_tier_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">בחר סוג מנוי...</option>
                        {subscriptionTiers.map((tier) => (
                          <option key={tier.id} value={tier.id}>
                            {tier.name} - {tier.price.toLocaleString('he-IL')} {tier.currency}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_active ?? true}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                          className="w-5 h-5 text-primary rounded focus:ring-primary"
                        />
                        <span className="text-text-primary font-medium">ארגון פעיל</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {organization.logo_url ? (
                    <div className="md:col-span-2 mb-4 relative group w-32">
                      <img
                        src={organization.logo_url}
                        alt={organization.name}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <label className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {uploadingLogo ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-white" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="md:col-span-2 mb-4">
                      <label className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                        {uploadingLogo ? (
                          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">העלה לוגו</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      <Mail className="inline w-4 h-4 ml-1" />
                      אימייל
                    </label>
                    <p className="text-text-primary">{organization.email}</p>
                  </div>
                  {organization.phone && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        <Phone className="inline w-4 h-4 ml-1" />
                        טלפון
                      </label>
                      <p className="text-text-primary">{organization.phone}</p>
                    </div>
                  )}
                  {organization.tax_id && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        חפ/מספר עוסק מורש
                      </label>
                      <p className="text-text-primary font-mono">{organization.tax_id}</p>
                    </div>
                  )}
                  {organization.business_number && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        מספר עסק
                      </label>
                      <p className="text-text-primary font-mono">{organization.business_number}</p>
                    </div>
                  )}
                  {(organization.address || organization.city || organization.postal_code) && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        <MapPin className="inline w-4 h-4 ml-1" />
                        כתובת
                      </label>
                      <p className="text-text-primary">
                        {[organization.address, organization.city, organization.postal_code, organization.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  {organization.website && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        <Globe className="inline w-4 h-4 ml-1" />
                        אתר אינטרנט
                      </label>
                      <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {organization.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      סוג מנוי
                    </label>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${organization.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      organization.subscription_tier === 'professional' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {organization.subscription_tier}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      תאריך יצירה
                    </label>
                    <p className="text-text-primary">
                      {new Date(organization.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  {organization.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        <FileText className="inline w-4 h-4 ml-1" />
                        הערות
                      </label>
                      <p className="text-text-primary whitespace-pre-wrap">{organization.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">משתמשי הארגון</h2>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  הוסף משתמש
                </button>
              </div>

              {/* User Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input
                    type="text"
                    placeholder="חפש משתמש לפי שם או אימייל..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {showAddUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">הוספת משתמש חדש</h3>
                    <button
                      onClick={() => {
                        setShowAddUser(false)
                        setNewUserForm({ email: '', firstName: '', lastName: '', role: 'manager' })
                      }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        שם פרטי <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newUserForm.firstName}
                        onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        שם משפחה <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newUserForm.lastName}
                        onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        אימייל <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        תפקיד <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      >
                        <option value="organization_admin">מנהל ארגון</option>
                        <option value="manager">מנהל</option>
                        <option value="employee">עובד</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowAddUser(false)
                        setNewUserForm({ email: '', firstName: '', lastName: '', role: 'manager' })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-text-primary hover:bg-gray-50"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={handleAddUser}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          מוסיף...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          הוסף משתמש
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {organizationUsers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                    <p className="text-text-secondary">אין משתמשים בארגון</p>
                  </div>
                ) : (
                  organizationUsers.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      {editingUser === user.user_id ? (
                        <div className="flex-1 mr-4">
                          <div className="mb-3">
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">אימייל</span>
                            <p className="text-text-primary text-sm font-medium">{user.email}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">שם פרטי</label>
                              <input
                                type="text"
                                value={editUserForm.firstName}
                                onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">שם משפחה</label>
                              <input
                                type="text"
                                value={editUserForm.lastName}
                                onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">תפקיד</label>
                              <select
                                value={editUserForm.role}
                                onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                              >
                                <option value="organization_admin">מנהל ארגון</option>
                                <option value="manager">מנהל</option>
                                <option value="employee">עובד</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-text-primary">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : 'ללא שם'}
                          </p>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${user.role === 'organization_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {user.role === 'organization_admin' ? 'מנהל ארגון' :
                              user.role === 'manager' ? 'מנהל' : 'עובד'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {editingUser === user.user_id ? (
                          <>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title="ביטול"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleUpdateUser}
                              disabled={saving}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                              title="שמור"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(user.user_id)
                                setEditUserForm({
                                  firstName: user.first_name || '',
                                  lastName: user.last_name || '',
                                  role: user.role as any,
                                })
                              }}
                              className="p-2 text-primary hover:bg-primary-light rounded-lg transition-colors"
                              title="ערוך"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendInvite(user.email || '')}
                              disabled={sendingEmail}
                              className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title="שלח מייל הזמנה"
                            >
                              {sendingEmail ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">מודולים פעילים</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    ערוך מודולים
                  </button>
                )}
              </div>

              {editing ? (
                <div>
                  <div className="mb-6">
                    <p className="text-sm text-text-secondary mb-4">
                      בחר את המודולים שיהיו פעילים בארגון. מודול הליבה תמיד פעיל.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {AVAILABLE_MODULES.map((module) => (
                        <div
                          key={module.id}
                          onClick={() => toggleModule(module.id)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${editForm.active_modules?.includes(module.id)
                            ? 'border-primary bg-primary-light'
                            : 'border-gray-200 hover:border-gray-300'
                            } ${module.id === 'core' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-text-primary">{module.name}</h3>
                              <p className="text-xs text-text-secondary">{module.nameEn}</p>
                            </div>
                            {editForm.active_modules?.includes(module.id) && (
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditing(false)
                        setEditForm(organization)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-text-primary hover:bg-gray-50"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          שומר...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          שמור שינויים
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {organization.active_modules?.map((module) => (
                    <div
                      key={module}
                      className="p-4 bg-primary-light border border-primary rounded-xl text-center"
                    >
                      <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-text-primary">
                        {moduleNames[module] || module}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">הגדרות ארגון</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">אזהרה: פעולות מסוכנות</h3>
                    <p className="text-sm text-yellow-800">
                      הפעולות הבאות הן בלתי הפיכות ויכולות להשפיע על כל הנתונים הקשורים לארגון.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-text-primary mb-2">מחיקת ארגון</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    מחיקת הארגון תמחק את כל הנתונים הקשורים אליו, כולל עובדים, משתמשים וכל המידע.
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        מוחק...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        מחק ארגון
                      </>
                    )}
                  </button>
                </div>

                {adminUser && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-text-primary mb-4">מנהל ראשוני</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          שם
                        </label>
                        <p className="text-text-primary">
                          {adminUser.first_name && adminUser.last_name
                            ? `${adminUser.first_name} ${adminUser.last_name}`
                            : 'לא זמין'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          <Mail className="inline w-4 h-4 ml-1" />
                          אימייל
                        </label>
                        <p className="text-text-primary">{adminUser.email}</p>
                      </div>
                      <button
                        onClick={() => handleSendInvite(adminUser.email)}
                        disabled={sendingEmail}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {sendingEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            שולח...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            שלח שוב מייל הזמנה
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
