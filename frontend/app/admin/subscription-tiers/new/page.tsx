'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Save, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

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

export default function NewSubscriptionTierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    price: 0,
    currency: 'ILS',
    billing_period: 'monthly' as 'monthly' | 'yearly',
    included_modules: ['core'] as string[],
    features: [''] as string[],
    max_employees: null as number | null,
    is_active: true,
    display_order: 0,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const toggleModule = (moduleId: string) => {
    if (moduleId === 'core') return // Core is always included
    
    setFormData(prev => ({
      ...prev,
      included_modules: prev.included_modules.includes(moduleId)
        ? prev.included_modules.filter(id => id !== moduleId)
        : [...prev.included_modules, moduleId]
    }))
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const validate = () => {
    if (!formData.name.trim()) {
      setError('שם סוג המנוי הוא שדה חובה')
      return false
    }
    if (formData.price < 0) {
      setError('מחיר לא יכול להיות שלילי')
      return false
    }
    if (formData.included_modules.length === 0) {
      setError('חייב לכלול לפחות מודול אחד')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('לא מחובר למערכת')

      const { data, error: insertError } = await supabase
        .from('subscription_tiers')
        .insert({
          ...formData,
          features: formData.features.filter(f => f.trim() !== ''),
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      toast.success('סוג המנוי נוצר בהצלחה!')
      router.push('/admin/subscription-tiers')
    } catch (err: any) {
      console.error('Error creating subscription tier:', err)
      const errorMessage = err.message || 'שגיאה ביצירת סוג המנוי'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-text-secondary hover:text-text-primary mb-4 flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימת סוגי מנויים
        </button>
        <h1 className="text-3xl font-bold text-text-primary">יצירת סוג מנוי חדש</h1>
        <p className="text-text-secondary mt-2">הגדר סוג מנוי חדש עם מחיר, מודולים ותכונות</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">פרטים בסיסיים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                שם (עברית) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="לדוגמה: בסיסי"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                שם (אנגלית)
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Example: Basic"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                תיאור (עברית)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
                placeholder="תיאור קצר של סוג המנוי"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                תיאור (אנגלית)
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => handleInputChange('description_en', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
                placeholder="Description in English"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">מחיר ותשלום</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                מחיר <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                מטבע
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ILS">ILS - ₪</option>
                <option value="USD">USD - $</option>
                <option value="EUR">EUR - €</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                תקופת חיוב
              </label>
              <select
                value={formData.billing_period}
                onChange={(e) => handleInputChange('billing_period', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="monthly">חודשי</option>
                <option value="yearly">שנתי</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">מודולים כלולים</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVAILABLE_MODULES.map((module) => (
              <div
                key={module.id}
                onClick={() => toggleModule(module.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.included_modules.includes(module.id)
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300'
                } ${module.id === 'core' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">{module.name}</h3>
                    <p className="text-xs text-text-secondary">{module.nameEn}</p>
                  </div>
                  {formData.included_modules.includes(module.id) && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">תכונות</h2>
          <div className="space-y-3">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="תכונה או יתרון"
                />
                <button
                  onClick={() => removeFeature(index)}
                  className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={addFeature}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              + הוסף תכונה
            </button>
          </div>
        </div>

        {/* Limits */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">הגבלות</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                מקסימום עובדים (השאר ריק ללא הגבלה)
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_employees || ''}
                onChange={(e) => handleInputChange('max_employees', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="לדוגמה: 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                סדר תצוגה
              </label>
              <input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
            <span className="text-text-primary font-medium">סוג מנוי פעיל</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-text-primary hover:bg-gray-50 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                יוצר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                צור סוג מנוי
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
