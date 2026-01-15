"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
  ArrowRight, 
  Save, 
  Loader2, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe,
  Hash,
  FileText,
  Briefcase
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  name_en?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  website?: string
  company_number?: string
  tax_id?: string
  industry?: string
  description?: string
  status: string
  subscription_tier: string
}

export default function EditOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<Organization>({
    id: '',
    name: '',
    name_en: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    website: '',
    company_number: '',
    tax_id: '',
    industry: '',
    description: '',
    status: 'active',
    subscription_tier: 'basic',
  })

  useEffect(() => {
    async function loadOrganization() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single()

        if (error) throw error
        if (data) {
          setFormData({
            id: data.id,
            name: data.name || '',
            name_en: data.name_en || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            website: data.website || '',
            company_number: data.company_number || '',
            tax_id: data.tax_id || '',
            industry: data.industry || '',
            description: data.description || '',
            status: data.status || 'active',
            subscription_tier: data.subscription_tier || 'basic',
          })
        }
      } catch (err: any) {
        setError('שגיאה בטעינת הארגון: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrganization()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          name: formData.name,
          name_en: formData.name_en,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          website: formData.website,
          company_number: formData.company_number,
          tax_id: formData.tax_id,
          industry: formData.industry,
          description: formData.description,
          status: formData.status,
          subscription_tier: formData.subscription_tier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בעדכון הארגון')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/admin/organizations/${orgId}`)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון הארגון')
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

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <Link
          href={`/admin/organizations/${orgId}`}
          className="mb-4 inline-flex items-center gap-2 text-primary hover:text-primary-dark"
        >
          <ArrowRight className="h-4 w-4" />
          חזור לפרטי הארגון
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">עריכת ארגון</h1>
        <p className="mt-1 text-text-secondary">{formData.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
            הארגון עודכן בהצלחה! מעביר לדף הארגון...
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">פרטים בסיסיים</h2>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                שם הארגון <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                שם באנגלית
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                סטטוס
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">פעיל</option>
                <option value="suspended">מושהה</option>
                <option value="cancelled">מבוטל</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                סוג מנוי
              </label>
              <select
                value={formData.subscription_tier}
                onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">פרטי עסק</h2>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-text-muted" />
                  ח"פ (מספר חברה)
                </span>
              </label>
              <input
                type="text"
                value={formData.company_number}
                onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="512345678"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-text-muted" />
                  מספר עוסק מורשה
                </span>
              </label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="012345678"
                dir="ltr"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-text-muted" />
                  תחום פעילות
                </span>
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="טכנולוגיה, קמעונאות, ייצור..."
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                תיאור
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="תיאור קצר של הארגון..."
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">פרטי קשר</h2>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-text-muted" />
                  אימייל
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-text-muted" />
                  טלפון
                </span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-text-muted" />
                  עיר
                </span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-text-muted" />
                  אתר אינטרנט
                </span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://example.com"
                dir="ltr"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-text-muted" />
                  כתובת מלאה
                </span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="רחוב, מספר, עיר, מיקוד"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
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
            href={`/admin/organizations/${orgId}`}
            className="rounded-lg border border-gray-300 px-6 py-3 text-text-primary transition-colors hover:bg-gray-50"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  )
}
