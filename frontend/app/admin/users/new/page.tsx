"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowRight, UserPlus, Shield, Building2, Loader2, CheckCircle2, Mail } from 'lucide-react'

interface Organization {
  id: string
  name: string
}

export default function NewUserPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'employee' as 'super_admin' | 'organization_admin' | 'manager' | 'employee',
    organization_id: '',
    send_invite: true,
  })

  useEffect(() => {
    async function loadOrganizations() {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active')
        .order('name')
      
      if (data) setOrganizations(data)
    }
    loadOrganizations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate
      if (!formData.email || !formData.full_name) {
        throw new Error('נא למלא את כל השדות הנדרשים')
      }

      if (formData.role !== 'super_admin' && !formData.organization_id) {
        throw new Error('נא לבחור ארגון')
      }

      // Create user with temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('משתמש עם אימייל זה כבר קיים במערכת')
        }
        throw signUpError
      }

      const userId = signUpData.user?.id
      if (!userId) throw new Error('שגיאה ביצירת המשתמש')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: formData.email,
          full_name: formData.full_name,
          is_super_admin: formData.role === 'super_admin',
        })

      if (profileError) throw profileError

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          organization_id: formData.role === 'super_admin' ? null : formData.organization_id,
          role: formData.role,
        })

      if (roleError) throw roleError

      // Send password reset email if requested
      if (formData.send_invite) {
        await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת המשתמש')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">המשתמש נוצר בהצלחה!</h1>
            {formData.send_invite && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-right">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">הזמנה נשלחה</span>
                </div>
                <p className="text-sm text-blue-700">
                  מייל עם קישור להגדרת סיסמה נשלח ל-{formData.email}
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Link
                href="/admin/users"
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-dark"
              >
                חזור לרשימת המשתמשים
              </Link>
              <button
                onClick={() => {
                  setSuccess(false)
                  setFormData({
                    email: '',
                    full_name: '',
                    phone: '',
                    role: 'employee',
                    organization_id: '',
                    send_invite: true,
                  })
                }}
                className="rounded-lg border border-gray-300 px-6 py-2 text-text-primary hover:bg-gray-50"
              >
                הוסף משתמש נוסף
              </button>
            </div>
          </div>
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
        <h1 className="text-3xl font-bold text-text-primary">הוספת משתמש חדש</h1>
        <p className="mt-2 text-text-secondary">צור משתמש חדש במערכת</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

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
                  <UserPlus className="h-5 w-5" />
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
                  <UserPlus className="h-5 w-5" />
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
                ארגון <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required={formData.role !== 'super_admin'}
              >
                <option value="">בחר ארגון...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {organizations.length === 0 && (
                <p className="mt-2 text-sm text-text-secondary">
                  אין ארגונים פעילים. <Link href="/admin/organizations/new" className="text-primary hover:underline">צור ארגון חדש</Link>
                </p>
              )}
            </div>
          )}

          {/* User Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                שם מלא <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="שם פרטי ושם משפחה"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                אימייל <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="user@example.com"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                טלפון
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>

            {/* Send Invite Option */}
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
              <input
                type="checkbox"
                id="send_invite"
                checked={formData.send_invite}
                onChange={(e) => setFormData({ ...formData, send_invite: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="send_invite" className="text-sm text-blue-800">
                <span className="font-medium">שלח הזמנה באימייל</span>
                <br />
                <span className="text-blue-600">המשתמש יקבל מייל עם קישור להגדרת סיסמה</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  יוצר משתמש...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  צור משתמש
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
