'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Organization {
  id: string
  org_number?: string
  name: string
  name_en?: string
  email: string
  phone?: string
  subscription_tier: string
  is_active: boolean
  active_modules: string[]
  created_at: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold text-text-primary">ארגונים</h1>
        <Link
          href="/admin/organizations/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>ארגון חדש</span>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="חפש לפי שם או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-main">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">מספר ארגון</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">שם הארגון</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">אימייל</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">טלפון</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">מנוי</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">סטטוס</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrgs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                  <p>אין ארגונים להצגה</p>
                </td>
              </tr>
            ) : (
              filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono font-semibold text-primary">
                      {org.org_number || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-text-primary">{org.name}</div>
                      {org.name_en && (
                        <div className="text-sm text-text-secondary">{org.name_en}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{org.email}</td>
                  <td className="px-6 py-4 text-text-secondary">{org.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      org.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      org.subscription_tier === 'professional' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {org.subscription_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      org.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {org.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      צפה
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
