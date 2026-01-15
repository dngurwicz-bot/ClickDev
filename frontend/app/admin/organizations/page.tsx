"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Plus, Building2, Search, Filter, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { SearchInput } from '@/components/ui/SearchInput'

interface Organization {
  id: string
  name: string
  name_en?: string
  email?: string
  phone?: string
  org_number?: number
  subscription_tier: string
  is_active: boolean
  status?: string
  created_at: string
  logo_url?: string
  city?: string
  industry?: string
  employee_count?: { count: number }[]
}

export default function OrganizationsPage() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || 'all'
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch organizations
  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          name_en,
          email,
          phone,
          org_number,
          subscription_tier,
          is_active,
          status,
          created_at,
          logo_url,
          city,
          industry,
          employee_count:employees(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setOrganizations(data || [])
      }
      setLoading(false)
    }

    fetchOrganizations()
  }, [])

  // Filter organizations based on search and status
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(org => 
        org.name?.toLowerCase().includes(query) ||
        org.name_en?.toLowerCase().includes(query) ||
        org.email?.toLowerCase().includes(query) ||
        org.city?.toLowerCase().includes(query) ||
        org.industry?.toLowerCase().includes(query) ||
        org.org_number?.toString().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => {
        if (statusFilter === 'active') return org.is_active
        if (statusFilter === 'inactive') return !org.is_active
        return true
      })
    }

    return filtered
  }, [organizations, searchQuery, statusFilter])

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          שגיאה בטעינת הארגונים: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">ארגונים</h1>
          <p className="mt-2 text-text-secondary">ניהול כל הארגונים במערכת</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-5 w-5" />
          <span>ארגון חדש</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <SearchInput 
            placeholder="חיפוש לפי שם, אימייל, עיר, מספר ארגון..."
            className="max-w-md flex-1"
          />
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString())
              if (e.target.value === 'all') {
                params.delete('status')
              } else {
                params.set('status', e.target.value)
              }
              window.history.pushState(null, '', `?${params.toString()}`)
              window.location.reload()
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="active">פעיל</option>
            <option value="inactive">לא פעיל</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-text-secondary">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              טוען...
            </span>
          ) : (
            <span>
              {filteredOrganizations.length} ארגונים
              {searchQuery && ` מתוך ${organizations.length}`}
            </span>
          )}
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  שם הארגון
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  מספר ארגון
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  אימייל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  מנוי
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  עובדים
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  תאריך יצירה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-text-secondary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      טוען ארגונים...
                    </div>
                  </td>
                </tr>
              ) : filteredOrganizations.length > 0 ? (
                filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link href={`/admin/organizations/${org.id}`} className="flex items-center gap-3 group">
                        {org.logo_url ? (
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-text-primary group-hover:text-primary transition-colors">
                            {org.name}
                          </div>
                          {org.name_en && (
                            <div className="text-sm text-text-secondary">{org.name_en}</div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary font-mono">
                      #{org.org_number || '---'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary">
                      {org.email || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`
                        inline-flex rounded-full px-2 py-1 text-xs font-medium
                        ${org.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' : ''}
                        ${org.subscription_tier === 'professional' ? 'bg-blue-100 text-blue-800' : ''}
                        ${org.subscription_tier === 'basic' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {org.subscription_tier === 'enterprise' ? 'Enterprise' : ''}
                        {org.subscription_tier === 'professional' ? 'Professional' : ''}
                        {org.subscription_tier === 'basic' ? 'Basic' : ''}
                        {!['enterprise', 'professional', 'basic'].includes(org.subscription_tier) ? org.subscription_tier : ''}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text-primary">
                      {org.employee_count?.[0]?.count || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`
                        inline-flex rounded-full px-2 py-1 text-xs font-medium
                        ${org.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {org.is_active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary">
                      {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: he })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="text-primary hover:text-primary-dark transition-colors"
                      >
                        צפה
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-12 w-12 text-gray-300" />
                      {searchQuery ? (
                        <>
                          <p className="text-text-secondary">לא נמצאו ארגונים התואמים לחיפוש "{searchQuery}"</p>
                          <button
                            onClick={() => {
                              window.history.pushState(null, '', window.location.pathname)
                              window.location.reload()
                            }}
                            className="text-primary hover:text-primary-dark"
                          >
                            נקה חיפוש
                          </button>
                        </>
                      ) : (
                        <p className="text-text-secondary">אין ארגונים במערכת</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
