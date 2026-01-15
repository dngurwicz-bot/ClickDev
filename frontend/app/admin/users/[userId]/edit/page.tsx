"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowRight, Save, Loader2, User, Shield, Building2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
}

interface UserData {
  id: string
  email: string
  full_name: string
  phone?: string
  is_super_admin: boolean
}

interface UserRole {
  id: string
  user_id: string
  organization_id: string | null
  role: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'employee' as string,
    organization_id: '',
    is_super_admin: false,
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load organizations
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('status', 'active')
          .order('name')
        
        if (orgs) setOrganizations(orgs)

        // Load user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError
        setUserData(profile)

        // Load user role
        const { data: role } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (role) setUserRole(role)

        // Set form data
        setFormData({
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          role: role?.role || 'employee',
          organization_id: role?.organization_id || '',
          is_super_admin: profile?.is_super_admin || false,
        })
      } catch (err: any) {
        setError('שגיאה בטעינת נתוני המשתמש')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          is_super_admin: formData.role === 'super_admin',
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // Update user role
      if (userRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role: formData.role,
            organization_id: formData.role === 'super_admin' ? null : formData.organization_id || null,
          })
          .eq('id', userRole.id)

        if (roleError) throw roleError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/users')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון המשתמש')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          משתמש לא נמצא
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 text-primary hover:text-primary-dark"
        >
          <ArrowRight className="h-4 w-4" />
          חזור לרשימת המשתמשים
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">עריכת משתמש</h1>
        <p className="mt-2 text-text-secondary">{userData.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
              המשתמש עודכן בהצלחה! מעביר לרשימת המשתמשים...
            </div>
          )}

          {/* User Info Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-text-primary text-lg">{userData.full_name || 'ללא שם'}</div>
              <div className="text-text-secondary">{userData.email}</div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              סוג משתמש
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'super_admin', organization_id: '' })}
                className={`
                  flex items-center gap-3 rounded-lg border-2 p-4 text-right transition-all
                  ${formData.role === 'super_admin' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${formData.role === 'super_admin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">Super Admin</div>
                  <div className="text-sm text-text-secondary">גישה מלאה לכל המערכת</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'organization_admin' })}
                className={`
                  flex items-center gap-3 rounded-lg border-2 p-4 text-right transition-all
                  ${formData.role === 'organization_admin' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${formData.role === 'organization_admin' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">מנהל ארגון</div>
                  <div className="text-sm text-text-secondary">ניהול ארגון ספציפי</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'manager' })}
                className={`
                  flex items-center gap-3 rounded-lg border-2 p-4 text-right transition-all
                  ${formData.role === 'manager' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${formData.role === 'manager' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">מנהל</div>
                  <div className="text-sm text-text-secondary">ניהול צוות בארגון</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'employee' })}
                className={`
                  flex items-center gap-3 rounded-lg border-2 p-4 text-right transition-all
                  ${formData.role === 'employee' 
                    ? 'border-gray-500 bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${formData.role === 'employee' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">עובד</div>
                  <div className="text-sm text-text-secondary">גישה בסיסית</div>
                </div>
              </button>
            </div>
          </div>

          {/* Organization Selection (not for Super Admin) */}
          {formData.role !== 'super_admin' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                ארגון
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">בחר ארגון...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                שם מלא
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="שם פרטי ושם משפחה"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  שמור שינויים
                </>
              )}
            </button>
            <Link
              href="/admin/users"
              className="rounded-lg border border-gray-300 px-6 py-3 text-text-primary transition-colors hover:bg-gray-50"
            >
              ביטול
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
