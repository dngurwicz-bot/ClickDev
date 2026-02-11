'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, Mail, Phone, MapPin, Upload, CheckCircle2, XCircle, Package, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Module {
  id: string
  name: string
  nameEn: string
  description: string
  premium: boolean
}

const AVAILABLE_MODULES: Module[] = [
  { id: 'core', name: 'ליבה', nameEn: 'Core', description: 'מודול הבסיס - ניהול עובדים, משכורות, היסטוריה', premium: false },
  { id: 'flow', name: 'Flow', nameEn: 'Flow', description: 'ניהול תהליכים וזרימות עבודה', premium: true },
  { id: 'docs', name: 'מסמכים', nameEn: 'Documents', description: 'ניהול מסמכים וקבצים', premium: true },
  { id: 'vision', name: 'Vision', nameEn: 'Vision', description: 'תכנון וראייה ארגונית', premium: true },
  { id: 'assets', name: 'נכסים', nameEn: 'Assets', description: 'ניהול נכסים וציוד', premium: true },
  { id: 'vibe', name: 'Vibe', nameEn: 'Vibe', description: 'תרבות ארגונית ושביעות רצון', premium: true },
  { id: 'grow', name: 'Grow', nameEn: 'Grow', description: 'התפתחות מקצועית והדרכות', premium: true },
  { id: 'insights', name: 'Insights', nameEn: 'Insights', description: 'אנליטיקה ודוחות מתקדמים', premium: true },
]

type TabType = 'organization' | 'subscription' | 'modules'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('organization')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    email: '',
    phone: '',
    address: '',
    subscriptionTierId: '' as string,
    activeModules: ['core'] as string[],
  })

  const [subscriptionTiers, setSubscriptionTiers] = useState<any[]>([])
  const [selectedTier, setSelectedTier] = useState<any>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  useEffect(() => {
    fetchSubscriptionTiers()
  }, [])

  const fetchSubscriptionTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setSubscriptionTiers(data || [])
    } catch (error) {
      console.error('Error fetching subscription tiers:', error)
    }
  }

  const handleTierChange = (tierId: string) => {
    const tier = subscriptionTiers.find(t => t.id === tierId)
    setSelectedTier(tier)
    setFormData(prev => ({
      ...prev,
      subscriptionTierId: tierId,
      activeModules: tier?.included_modules || ['core']
    }))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('גודל הקובץ חייב להיות קטן מ-5MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleModule = (moduleId: string) => {
    if (moduleId === 'core') return // Core is always active

    setFormData(prev => ({
      ...prev,
      activeModules: prev.activeModules.includes(moduleId)
        ? prev.activeModules.filter(id => id !== moduleId)
        : [...prev.activeModules, moduleId]
    }))
  }

  const validateAll = () => {
    if (!formData.name.trim()) {
      setError('שם הארגון הוא שדה חובה')
      setActiveTab('organization')
      return false
    }
    if (!formData.email.trim()) {
      setError('אימייל הארגון הוא שדה חובה')
      setActiveTab('organization')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('אימייל לא תקין')
      setActiveTab('organization')
      return false
    }
    if (!formData.subscriptionTierId) {
      setError('יש לבחור סוג מנוי')
      setActiveTab('subscription')
      return false
    }
    return true
  }

  const getTabStatus = (tab: TabType) => {
    switch (tab) {
      case 'organization':
        return formData.name && formData.email ? 'complete' : 'incomplete'
      case 'subscription':
        return formData.subscriptionTierId ? 'complete' : 'incomplete'
      case 'modules':
        return formData.activeModules.length > 0 ? 'complete' : 'incomplete'
      default:
        return 'incomplete'
    }
  }

  const handleSubmit = async () => {
    if (!validateAll()) return

    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('לא מחובר למערכת')

      // Step 1: Upload logo if exists
      let logoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `organizations/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.warn('Logo upload failed:', uploadError)
          // Continue without logo
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath)
          logoUrl = publicUrl
        }
      }

      // Step 2: Create organization via Backend API (Bypasses RLS)
      const apiResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
          name_en: formData.nameEn || null,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          active_modules: formData.activeModules,
          subscription_tier_id: formData.subscriptionTierId,
          subscription_tier: selectedTier?.name || 'Basic',
          admin_email: user.email, // Required by backend model
          logo_url: logoUrl
        })
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json()
        throw new Error(errorData.detail || 'Failed to create organization')
      }

      const org = await apiResponse.json()

      // Automatically assign the creator as an Organization Admin
      // We use the add-user API for this to ensure consistency and bypass RLS if needed
      try {
        const adminData = {
          firstName: user.user_metadata?.first_name || 'Admin',
          lastName: user.user_metadata?.last_name || 'User',
          email: user.email,
          role: 'organization_admin'
        }

        // We use the API because it uses service_role key to write to user_roles
        // Standard users might not have insert permission on user_roles depending on RLS
        await fetch('/api/organizations/add-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: org.id,
            userData: adminData,
          }),
        })
      } catch (adminError) {
        console.error('Failed to assign creator as admin:', adminError)
        // We don't block the flow, but we warn
        toast.error('הארגון נוצר אך הייתה בעיה בהגדרת המנהל. אנא פנה לתמיכה.')
      }

      toast.success('הארגון נוצר בהצלחה! כעת תוכל להוסיף מנהל ראשוני דרך דף העריכה.')
      router.push(`/admin/organizations/${org.id}`)
    } catch (err: any) {
      console.error('Error creating organization:', err)
      let errorMessage = err.message || 'שגיאה ביצירת הארגון'

      // Translate common database errors to Hebrew
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        if (errorMessage.includes('organizations_email_key')) {
          errorMessage = 'אימייל הארגון כבר קיים במערכת. אנא בחר אימייל אחר.'
        } else {
          errorMessage = 'הנתונים שהוזנו כבר קיימים במערכת. אנא בדוק את הפרטים.'
        }
      } else if (errorMessage.includes('violates foreign key constraint')) {
        errorMessage = 'שגיאה בקשרים בין הנתונים. אנא בדוק את הפרטים שהוזנו.'
      } else if (errorMessage.includes('permission denied')) {
        errorMessage = 'אין הרשאה לבצע פעולה זו. אנא פנה למנהל המערכת.'
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'organization' as TabType, label: 'פרטי הארגון', icon: Building2 },
    { id: 'subscription' as TabType, label: 'סוג מנוי', icon: Package },
    { id: 'modules' as TabType, label: 'מודולים', icon: Package },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-text-secondary hover:text-text-primary mb-4 flex items-center gap-2 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימת ארגונים
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">יצירת ארגון חדש</h1>
            <p className="text-text-secondary mt-2">מלא את הפרטים להקמת ארגון חדש במערכת</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const status = getTabStatus(tab.id)
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
                  {status === 'complete' && (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">פרטי הארגון</h2>
                  <p className="text-sm text-text-secondary">מידע בסיסי על הארגון</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Logo Section */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    לוגו הארגון
                  </label>
                  <div className="space-y-3">
                    {logoPreview ? (
                      <div className="relative group">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full aspect-square object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setLogoPreview('')
                            setLogoFile(null)
                          }}
                          className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-primary transition-colors bg-gray-50">
                          <Upload className="w-12 h-12 text-text-muted mb-2" />
                          <span className="text-sm text-text-secondary">העלה לוגו</span>
                          <span className="text-xs text-text-muted mt-1">PNG, JPG עד 5MB</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        שם הארגון (עברית) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="לדוגמה: חברת טכנולוגיה בע״מ"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        שם הארגון (אנגלית)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => handleInputChange('nameEn', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Example: Tech Company Ltd."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      <Mail className="inline w-4 h-4 ml-1" />
                      אימייל הארגון <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="info@company.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <Phone className="inline w-4 h-4 ml-1" />
                        טלפון
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="03-1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        <MapPin className="inline w-4 h-4 ml-1" />
                        כתובת
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="רחוב, עיר, מיקוד"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">סוג מנוי</h2>
                  <p className="text-sm text-text-secondary">בחר את סוג המנוי המתאים לארגון</p>
                </div>
              </div>

              {subscriptionTiers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Package className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                  <p className="text-text-secondary mb-4">אין סוגי מנויים זמינים</p>
                  <Link
                    href="/admin/subscription-tiers/new"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
                  >
                    צור סוג מנוי חדש
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionTiers.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => handleTierChange(tier.id)}
                      className={`
                        p-6 border-2 rounded-xl cursor-pointer transition-all
                        ${formData.subscriptionTierId === tier.id
                          ? 'border-primary bg-primary-light shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                          {tier.name_en && (
                            <p className="text-sm text-text-secondary">{tier.name_en}</p>
                          )}
                        </div>
                        {formData.subscriptionTierId === tier.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">
                            {tier.price.toLocaleString('he-IL')}
                          </span>
                          <span className="text-sm text-text-secondary">
                            {tier.currency} / {tier.billing_period === 'monthly' ? 'חודש' : 'שנה'}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-sm text-text-secondary mt-2">{tier.description}</p>
                        )}
                      </div>
                      {tier.max_employees ? (
                        <p className="text-xs text-text-muted">עד {tier.max_employees.toLocaleString('he-IL')} עובדים</p>
                      ) : (
                        <p className="text-xs text-text-muted">ללא הגבלת עובדים</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedTier && (
                <div className="mt-6 p-6 bg-primary-light rounded-xl border border-primary/20">
                  <h3 className="font-semibold text-text-primary mb-3">מודולים כלולים בסוג מנוי זה:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTier.included_modules?.map((module: string) => (
                      <span
                        key={module}
                        className="px-3 py-1 bg-white text-primary text-sm rounded-lg font-medium"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">מודולים פעילים</h2>
                  <p className="text-sm text-text-secondary">בחר את המודולים שיהיו פעילים בארגון</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {AVAILABLE_MODULES.map((module) => (
                  <div
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`
                      p-5 border-2 rounded-xl cursor-pointer transition-all
                      ${formData.activeModules.includes(module.id)
                        ? 'border-primary bg-primary-light shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                      ${module.id === 'core' ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-text-primary">{module.name}</h3>
                        <p className="text-xs text-text-secondary">{module.nameEn}</p>
                      </div>
                      {formData.activeModules.includes(module.id) && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{module.description}</p>
                    {module.premium && (
                      <span className="inline-block text-xs bg-warning/20 text-warning px-2 py-1 rounded">
                        Premium
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {tabs.filter(t => getTabStatus(t.id) === 'complete').length} מתוך {tabs.length} לשוניות הושלמו
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-text-primary hover:bg-gray-50 transition-colors font-medium"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  יוצר ארגון...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  צור ארגון
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
