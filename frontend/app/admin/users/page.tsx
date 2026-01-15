"use client"

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Users, Mail, Plus, Search, Loader2, Shield, Building2, UserCog } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import Link from 'next/link'
import { UserActions } from '@/components/admin/UserActions'
import { SearchInput } from '@/components/ui/SearchInput'

interface UserRole {
  id: string
  user_id: string
  role: string
  organization_id?: string
  created_at: string
  organization?: { name: string }
  profile?: {
    id: string
    email: string
    full_name?: string
    is_super_admin: boolean
  }
}

export default function UsersPage() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const roleFilter = searchParams.get('role') || 'all'
  
  const [users, setUsers] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      const supabase = createClient()
      
      // Get all user roles with organizations
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false })

      if (rolesError) {
        setError(rolesError.message)
        setLoading(false)
        return
      }

      // Get all profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')

      // Create a map of profiles by user_id for quick lookup
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Combine the data
      const usersWithProfiles = userRoles?.map(role => ({
        ...role,
        profile: profilesMap.get(role.user_id) || null
      })) || []

      setUsers(usersWithProfiles)
      setLoading(false)
    }

    fetchUsers()
  }, [])

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.profile?.full_name?.toLowerCase().includes(query) ||
        user.profile?.email?.toLowerCase().includes(query) ||
        user.organization?.name?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    return filtered
  }, [users, searchQuery, roleFilter])

  // Count by role
  const roleCounts = useMemo(() => ({
    all: users.length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
    organization_admin: users.filter(u => u.role === 'organization_admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    employee: users.filter(u => u.role === 'employee').length,
  }), [users])

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          שגיאה בטעינת המשתמשים: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">משתמשים</h1>
          <p className="mt-2 text-text-secondary">ניהול כל המשתמשים במערכת</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-5 w-5" />
          <span>משתמש חדש</span>
        </Link>
      </div>

      {/* Role Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('role')
            window.history.pushState(null, '', `?${params.toString()}`)
            window.location.reload()
          }}
          className={`rounded-lg p-4 text-center transition-all ${
            roleFilter === 'all' 
              ? 'bg-primary text-white shadow-lg' 
              : 'bg-white hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold">{roleCounts.all}</div>
          <div className={`text-sm ${roleFilter === 'all' ? 'text-white/80' : 'text-text-secondary'}`}>
            כל המשתמשים
          </div>
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('role', 'super_admin')
            window.history.pushState(null, '', `?${params.toString()}`)
            window.location.reload()
          }}
          className={`rounded-lg p-4 text-center transition-all ${
            roleFilter === 'super_admin' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-white hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold">{roleCounts.super_admin}</div>
          <div className={`text-sm ${roleFilter === 'super_admin' ? 'text-white/80' : 'text-text-secondary'}`}>
            Super Admin
          </div>
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('role', 'organization_admin')
            window.history.pushState(null, '', `?${params.toString()}`)
            window.location.reload()
          }}
          className={`rounded-lg p-4 text-center transition-all ${
            roleFilter === 'organization_admin' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-white hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold">{roleCounts.organization_admin}</div>
          <div className={`text-sm ${roleFilter === 'organization_admin' ? 'text-white/80' : 'text-text-secondary'}`}>
            מנהלי ארגון
          </div>
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('role', 'manager')
            window.history.pushState(null, '', `?${params.toString()}`)
            window.location.reload()
          }}
          className={`rounded-lg p-4 text-center transition-all ${
            roleFilter === 'manager' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-white hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold">{roleCounts.manager}</div>
          <div className={`text-sm ${roleFilter === 'manager' ? 'text-white/80' : 'text-text-secondary'}`}>
            מנהלים
          </div>
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('role', 'employee')
            window.history.pushState(null, '', `?${params.toString()}`)
            window.location.reload()
          }}
          className={`rounded-lg p-4 text-center transition-all ${
            roleFilter === 'employee' 
              ? 'bg-gray-600 text-white shadow-lg' 
              : 'bg-white hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold">{roleCounts.employee}</div>
          <div className={`text-sm ${roleFilter === 'employee' ? 'text-white/80' : 'text-text-secondary'}`}>
            עובדים
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput 
          placeholder="חיפוש לפי שם, אימייל או ארגון..."
          className="max-w-md flex-1"
        />

        {/* Results count */}
        <div className="text-sm text-text-secondary">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              טוען...
            </span>
          ) : (
            <span>
              {filteredUsers.length} משתמשים
              {searchQuery && ` מתוך ${users.length}`}
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  שם מלא
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  אימייל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  תפקיד
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  ארגון
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-text-secondary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      טוען משתמשים...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((userRole) => {
                  const profile = userRole.profile
                  const role = userRole.role
                  
                  return (
                    <tr key={userRole.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            role === 'super_admin' ? 'bg-purple-100' :
                            role === 'organization_admin' ? 'bg-blue-100' :
                            role === 'manager' ? 'bg-green-100' :
                            'bg-gray-100'
                          }`}>
                            {role === 'super_admin' ? (
                              <Shield className="h-5 w-5 text-purple-600" />
                            ) : role === 'organization_admin' ? (
                              <Building2 className="h-5 w-5 text-blue-600" />
                            ) : role === 'manager' ? (
                              <UserCog className="h-5 w-5 text-green-600" />
                            ) : (
                              <Users className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">
                              {profile?.full_name || 'ללא שם'}
                            </div>
                            {profile?.is_super_admin && (
                              <div className="text-xs text-purple-600">Super Admin</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-text-muted" />
                          <span className="text-sm text-text-primary">{profile?.email || '-'}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`
                          inline-flex rounded-full px-2 py-1 text-xs font-medium
                          ${role === 'super_admin' ? 'bg-purple-100 text-purple-800' : ''}
                          ${role === 'organization_admin' ? 'bg-blue-100 text-blue-800' : ''}
                          ${role === 'manager' ? 'bg-green-100 text-green-800' : ''}
                          ${role === 'employee' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {role === 'super_admin' && 'Super Admin'}
                          {role === 'organization_admin' && 'מנהל ארגון'}
                          {role === 'manager' && 'מנהל'}
                          {role === 'employee' && 'עובד'}
                          {!['super_admin', 'organization_admin', 'manager', 'employee'].includes(role) && role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary">
                        {userRole.organization?.name || (role === 'super_admin' ? 'כל הארגונים' : '-')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary">
                        {userRole.created_at 
                          ? format(new Date(userRole.created_at), 'dd/MM/yyyy', { locale: he })
                          : '-'
                        }
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <UserActions 
                          userId={userRole.user_id} 
                          roleId={userRole.id}
                          userEmail={profile?.email}
                          isSuperAdmin={role === 'super_admin'}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-12 w-12 text-gray-300" />
                      {searchQuery ? (
                        <>
                          <p className="text-text-secondary">לא נמצאו משתמשים התואמים לחיפוש "{searchQuery}"</p>
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
                        <p className="text-text-secondary">אין משתמשים במערכת</p>
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
