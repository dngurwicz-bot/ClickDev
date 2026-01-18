'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Package, Edit, Trash2, CheckCircle2, XCircle, LayoutGrid, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import GlobalLoader from '@/components/ui/GlobalLoader'

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

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
    return <GlobalLoader />
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">סוגי מנויים</h1>
          <p className="text-gray-500 mt-1">ניהול חבילות ומסלולי רישוי במערכת</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-white border border-gray-200 p-1 rounded-lg flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="תצוגת כרטיסים"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="תצוגת טבלה"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <Link
            href="/admin/subscription-tiers/new"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            <span>סוג מנוי חדש</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="חיפוש מנוי..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Content Area */}
      {filteredTiers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">אין סוגי מנויים להצגה</h3>
          <p className="text-gray-500">לא נמצאו מנויים התואמים את החיפוש שלך</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // GRID VIEW
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-md ${tier.is_active
                    ? 'border-transparent ring-1 ring-gray-100 hover:ring-primary/50'
                    : 'border-gray-100 opacity-75 grayscale-[0.5]'
                    }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                      {tier.name_en && (
                        <p className="text-sm text-gray-500 font-medium">{tier.name_en}</p>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tier.is_active
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                      {tier.is_active ? 'פעיל' : 'לא פעיל'}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900 tracking-tight">
                        {tier.price.toLocaleString('he-IL')}
                      </span>
                      <span className="text-lg font-medium text-gray-500">
                        {tier.currency}
                      </span>
                      <span className="text-gray-400 text-sm mr-1">
                        / {tier.billing_period === 'monthly' ? 'חודש' : 'שנה'}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{tier.description}</p>
                    )}
                  </div>

                  {/* Modules */}
                  <div className="mb-6 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">מודולים</p>
                      <div className="flex flex-wrap gap-2">
                        {tier.included_modules?.slice(0, 4).map((module) => (
                          <span
                            key={module}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100"
                          >
                            {module}
                          </span>
                        ))}
                        {tier.included_modules?.length > 4 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">+{tier.included_modules.length - 4}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="mb-6 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {tier.max_employees ? `עד ${tier.max_employees.toLocaleString()} עובדים` : 'ללא הגבלת עובדים'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      href={`/admin/subscription-tiers/${tier.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      ערוך
                    </Link>
                    <button
                      onClick={() => handleToggleActive(tier.id, tier.is_active)}
                      className={`p-2 rounded-lg transition-colors border ${tier.is_active
                        ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      title={tier.is_active ? 'השבת מנוי' : 'הפעל מנוי'}
                    >
                      {tier.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(tier.id)}
                      disabled={deletingId === tier.id}
                      className="p-2 border border-red-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      title="מחק מנוי"
                    >
                      {deletingId === tier.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // TABLE VIEW
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">שם המנוי</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">מחיר</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">מודולים</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">מגבלת עובדים</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">סטטוס</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTiers.map((tier) => (
                      <tr key={tier.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{tier.name}</span>
                            <span className="text-xs text-gray-500">{tier.name_en}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 font-medium text-gray-900">
                            {tier.price.toLocaleString()} {tier.currency}
                            <span className="text-gray-400 text-xs font-normal">/ {tier.billing_period === 'monthly' ? 'חודש' : 'שנה'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {tier.included_modules?.slice(0, 3).map(m => (
                              <span key={m} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded border border-gray-200">{m}</span>
                            ))}
                            {tier.included_modules?.length > 3 && <span className="text-xs text-gray-400">+{tier.included_modules.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tier.max_employees ? tier.max_employees.toLocaleString() : 'ללא הגבלה'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tier.is_active ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                            }`}>
                            {tier.is_active ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/subscription-tiers/${tier.id}/edit`}
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                              title="ערוך"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleToggleActive(tier.id, tier.is_active)}
                              className={`p-1.5 rounded-md transition-all ${tier.is_active ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={tier.is_active ? 'השבת' : 'הפעל'}
                            >
                              {tier.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(tier.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                              title="מחק"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
