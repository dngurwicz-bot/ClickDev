"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
  Building2, 
  Package, 
  UserCog, 
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  TrendingUp,
  FileText,
  BarChart3,
  Mail,
  Loader2
} from 'lucide-react'

// Icon mapping for modules
const moduleIcons: Record<string, any> = {
  Users, 
  Workflow: ArrowRight,
  FileText, 
  Network: Building2,
  Car: Package,
  Heart: Users,
  TrendingUp, 
  BarChart3
}

interface Module {
  id: string
  name: string
  name_en: string
  description: string
  icon: string
  is_core: boolean
  price_monthly: number
  tag?: string
  target_audience?: string
}

interface FormData {
  name: string
  name_en: string
  email: string
  phone: string
  address: string
  subscription_tier: string
  active_modules: string[]
  admin_email: string
  admin_first_name: string
  admin_last_name: string
  admin_phone: string
}

const steps = [
  { id: 1, name: 'פרטי ארגון', icon: Building2 },
  { id: 2, name: 'מודולים', icon: Package },
  { id: 3, name: 'מנהל מערכת', icon: UserCog },
  { id: 4, name: 'סיכום', icon: CheckCircle2 },
]

export default function CreateOrganizationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [createdOrg, setCreatedOrg] = useState<any>(null)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    name_en: '',
    email: '',
    phone: '',
    address: '',
    subscription_tier: 'basic',
    active_modules: ['core'],
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_phone: '',
  })

  useEffect(() => {
    async function loadModules() {
      const { data } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (data) setModules(data)
    }
    loadModules()
  }, [])

  const handleModuleToggle = (moduleId: string, isCore: boolean) => {
    if (isCore) return
    
    setFormData(prev => ({
      ...prev,
      active_modules: prev.active_modules.includes(moduleId)
        ? prev.active_modules.filter(m => m !== moduleId)
        : [...prev.active_modules, moduleId]
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email)
      case 2:
        return formData.active_modules.includes('core')
      case 3:
        return !!(formData.admin_email && formData.admin_first_name && formData.admin_last_name)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      setError(null)
    } else {
      setError('נא למלא את כל השדות הנדרשים')
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          name_en: formData.name_en,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          subscription_tier: formData.subscription_tier,
          active_modules: formData.active_modules,
          created_by: user?.id,
        })
        .select()
        .single()

      if (orgError) throw orgError
      setCreatedOrg(org)

      // Create admin user using API route (ensures user is created in auth.users)
      let emailSent = false
      let emailError: string | null = null
      let adminUserId: string | null = null
      
      try {
        const response = await fetch('/api/admin/organizations/create-admin-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.admin_email,
            firstName: formData.admin_first_name,
            lastName: formData.admin_last_name,
            phone: formData.admin_phone || '',
            organizationId: org.id,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה ביצירת מנהל הארגון')
        }

        adminUserId = data.userId
        emailSent = data.emailSent || false
        emailError = data.emailError || null
      } catch (createErr: any) {
        console.error('Error creating admin user:', createErr)
        emailError = createErr.message || 'שגיאה ביצירת מנהל הארגון'
      }

      // Profile and user_role are created by the API route
      // No need to create them here
      
      setCreatedOrg({ ...org, emailSent, emailError, adminEmail: formData.admin_email })

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת הארגון')
    } finally {
      setLoading(false)
    }
  }

  if (success && createdOrg) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">הארגון נוצר בהצלחה!</h1>
            <p className="text-text-secondary mb-6">
              מספר ארגון: <span className="font-mono font-bold text-primary">{createdOrg.org_number}</span>
            </p>
            {createdOrg.emailSent ? (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-right border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">הודעה נשלחה למנהל המערכת</span>
                </div>
                <p className="text-sm text-blue-700">
                  מייל עם קישור לאיפוס סיסמה נשלח ל-{formData.admin_email}
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-lg p-4 mb-6 text-right border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">המייל לא נשלח</span>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  לא ניתן לשלוח מייל אוטומטי ל-{formData.admin_email}
                </p>
                {createdOrg.emailError && (
                  <p className="text-xs text-amber-600 mb-3 bg-amber-100 p-2 rounded">
                    שגיאה: {createdOrg.emailError}
                  </p>
                )}
                <p className="text-xs text-amber-600 mb-3">
                  💡 ניתן לשלוח מייל מחדש מדף הארגון
                </p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Link
                href={`/admin/organizations/${createdOrg.id}`}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-dark"
              >
                צפה בארגון
              </Link>
              <Link
                href="/admin/organizations"
                className="rounded-lg border border-gray-300 px-6 py-2 text-text-primary hover:bg-gray-50"
              >
                חזור לרשימה
              </Link>
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
          href="/admin/organizations"
          className="mb-4 inline-flex items-center gap-2 text-primary hover:text-primary-dark"
        >
          <ArrowRight className="h-4 w-4" />
          חזור לרשימת הארגונים
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">הקמת ארגון חדש</h1>
        <p className="mt-2 text-text-secondary">מלא את הפרטים ליצירת ארגון חדש במערכת</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors
                    ${isActive ? 'border-primary bg-primary text-white' : ''}
                    ${isCompleted ? 'border-primary bg-primary-light text-primary' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-300 bg-white text-gray-400' : ''}
                  `}>
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-1 w-16 rounded ${currentStep > step.id ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl bg-white p-6 shadow-sm">
        {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

          {/* Step 1: Organization Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">פרטי הארגון</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
          <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    שם הארגון (עברית) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="לדוגמה: חברת הייטק בע״מ"
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
              שם הארגון (אנגלית)
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. HiTech Company Ltd."
                    dir="ltr"
            />
                </div>
          </div>

              <div className="grid gap-6 md:grid-cols-2">
          <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    אימייל ארגוני <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="info@company.com"
                    dir="ltr"
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
                    placeholder="03-1234567"
                    dir="ltr"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
              כתובת
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="רחוב, עיר, מיקוד"
            />
          </div>

          <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
              סוג מנוי
            </label>
                <div className="grid gap-4 md:grid-cols-3">
                  {['basic', 'professional', 'enterprise'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setFormData({ ...formData, subscription_tier: tier })}
                      className={`
                        rounded-lg border-2 p-4 text-center transition-colors
                        ${formData.subscription_tier === tier 
                          ? 'border-primary bg-primary-light' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-medium text-text-primary capitalize">{tier}</div>
                      <div className="text-sm text-text-secondary">
                        {tier === 'basic' && 'עד 50 עובדים'}
                        {tier === 'professional' && 'עד 200 עובדים'}
                        {tier === 'enterprise' && 'ללא הגבלה'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Modules */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">בחירת מודולים</h2>
                <p className="text-sm text-text-secondary mt-1">בחר את המודולים שיהיו זמינים לארגון. CLICK Core הוא חובה לכל ארגון.</p>
              </div>

              <div className="space-y-3">
                {modules.map((module) => {
                  const isSelected = formData.active_modules.includes(module.id)
                  const IconComponent = moduleIcons[module.icon] || Package
                  
                  const getTagColor = (tag?: string) => {
                    if (!tag) return 'bg-gray-100 text-gray-600'
                    if (tag.includes('חובה')) return 'bg-primary text-white'
                    if (tag.includes('נמכר')) return 'bg-green-100 text-green-700'
                    if (tag.includes('Premium')) return 'bg-purple-100 text-purple-700'
                    return 'bg-blue-100 text-blue-700'
                  }
                  
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => handleModuleToggle(module.id, module.is_core)}
                      disabled={module.is_core}
                      className={`
                        relative w-full rounded-xl border-2 p-5 text-right transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                        ${module.is_core ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors
                          ${isSelected 
                            ? 'border-primary bg-primary text-white' 
                            : 'border-gray-300 bg-white'
                          }
                        `}>
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                        
                        <div className={`
                          flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                          ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}
                        `}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-text-primary text-lg">{module.name}</span>
                            {module.tag && (
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagColor(module.tag)}`}>
                                {module.tag}
                              </span>
                            )}
                          </div>
                          {module.target_audience && (
                            <p className="text-sm text-primary font-medium mt-0.5">{module.target_audience}</p>
                          )}
                          <p className="text-sm text-text-secondary mt-1">{module.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
          </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    מודולים נבחרים: {formData.active_modules.length}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {formData.active_modules.map(id => {
                      const mod = modules.find(m => m.id === id)
                      return mod ? (
                        <span key={id} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {mod.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Admin User */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">מנהל מערכת הארגון</h2>
                <p className="text-sm text-text-secondary mt-1">
                  הזן את פרטי מנהל המערכת. הוא יקבל מייל עם קישור להגדרת סיסמה.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">מייל אוטומטי</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  לאחר יצירת הארגון, מנהל המערכת יקבל מייל עם קישור לאיפוס סיסמה וכניסה למערכת.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    שם פרטי <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.admin_first_name}
                    onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="שם פרטי"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    שם משפחה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.admin_last_name}
                    onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="שם משפחה"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    אימייל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="admin@company.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="050-1234567"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text-primary">סיכום ואישור</h2>
              
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    פרטי ארגון
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">שם:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    {formData.name_en && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">שם באנגלית:</span>
                        <span className="font-medium">{formData.name_en}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-text-secondary">אימייל:</span>
                      <span className="font-medium" dir="ltr">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">סוג מנוי:</span>
                      <span className="font-medium capitalize">{formData.subscription_tier}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    מודולים נבחרים ({formData.active_modules.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.active_modules.map(moduleId => {
                      const module = modules.find(m => m.id === moduleId)
                      return module ? (
                        <span key={moduleId} className="rounded-full bg-primary-light px-3 py-1 text-sm text-primary">
                          {module.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    מנהל מערכת
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">שם:</span>
                      <span className="font-medium">{formData.admin_first_name} {formData.admin_last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">אימייל:</span>
                      <span className="font-medium" dir="ltr">{formData.admin_email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2 text-text-primary transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-4 w-4" />
              הקודם
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-dark"
              >
                הבא
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    יוצר ארגון...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    צור ארגון
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
