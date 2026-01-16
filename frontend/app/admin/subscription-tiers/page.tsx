'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Package, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface SubscriptionTier {
  id: string
  name: string
  name_en?: string
  description?: string
  price: number
  currency: string
  billing_period: string
  included_modules: string[]
  features: string[]
  max_employees?: number
  is_active: boolean
  display_order: number
}

export default function SubscriptionTiersPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setTiers(data || [])
    } catch (error: any) {
      console.error('Error fetching tiers:', error)
      toast.error('שגיאה בטעינת סוגי המנויים')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את סוג המנוי הזה?')) {
      return
    }

    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('סוג המנוי נמחק בהצלחה')
      fetchTiers()
    } catch (error: any) {
      console.error('Error deleting tier:', error)
      toast.error(error.message || 'שגיאה במחיקת סוג המנוי')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(`סוג המנוי ${!currentStatus ? 'הופעל' : 'הושבת'} בהצלחה`)
      fetchTiers()
    } catch (error: any) {
      console.error('Error toggling tier:', error)
      toast.error('שגיאה בעדכון סטטוס')
    }
  }

  const filteredTiers = tiers.filter(tier =>
    tier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tier.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">סוגי מנויים</h1>
        <Link
          href="/admin/subscription-tiers/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>סוג מנוי חדש</span>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="חפש לפי שם..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTiers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-text-muted" />
            <p className="text-text-secondary">אין סוגי מנויים להצגה</p>
          </div>
        ) : (
          filteredTiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                tier.is_active
                  ? 'border-gray-200 hover:border-primary'
                  : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-text-primary">{tier.name}</h3>
                  {tier.name_en && (
                    <p className="text-sm text-text-secondary">{tier.name_en}</p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded text-xs font-medium ${
                  tier.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tier.is_active ? 'פעיל' : 'לא פעיל'}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {tier.price.toLocaleString('he-IL')}
                  </span>
                  <span className="text-text-secondary">
                    {tier.currency} / {tier.billing_period === 'monthly' ? 'חודש' : 'שנה'}
                  </span>
                </div>
                {tier.description && (
                  <p className="text-sm text-text-secondary mt-2">{tier.description}</p>
                )}
              </div>

              {/* Modules */}
              <div className="mb-4">
                <p className="text-sm font-medium text-text-primary mb-2">מודולים כלולים:</p>
                <div className="flex flex-wrap gap-2">
                  {tier.included_modules?.map((module) => (
                    <span
                      key={module}
                      className="px-2 py-1 bg-primary-light text-primary text-xs rounded"
                    >
                      {module}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              {tier.features && tier.features.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-text-primary mb-2">תכונות:</p>
                  <ul className="text-sm text-text-secondary space-y-1">
                    {tier.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {tier.features.length > 3 && (
                      <li className="text-xs text-text-muted">
                        +{tier.features.length - 3} תכונות נוספות
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Limits */}
              <div className="mb-4 text-sm text-text-secondary">
                {tier.max_employees ? (
                  <p>עד {tier.max_employees.toLocaleString('he-IL')} עובדים</p>
                ) : (
                  <p>ללא הגבלת עובדים</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <Link
                  href={`/admin/subscription-tiers/${tier.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-text-primary"
                >
                  <Edit className="w-4 h-4" />
                  ערוך
                </Link>
                <button
                  onClick={() => handleToggleActive(tier.id, tier.is_active)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    tier.is_active
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {tier.is_active ? 'השבת' : 'הפעל'}
                </button>
                <button
                  onClick={() => handleDelete(tier.id)}
                  disabled={deletingId === tier.id}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {deletingId === tier.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-800"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
