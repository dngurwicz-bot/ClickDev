"use client"

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Activity,
  Table2,
  Download
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, startOfDay, endOfDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts'
import { AnalyticsFilters, DateRange } from '@/components/admin/AnalyticsFilters'
import { exportAnalyticsData } from '@/lib/utils/exportToExcel'
import { createClient } from '@/utils/supabase/client'

interface AnalyticsPageClientProps {
  initialOrganizations: any[]
  initialEmployees: any[]
  initialUserRoles: any[]
}

export function AnalyticsPageClient({
  initialOrganizations,
  initialEmployees,
  initialUserRoles
}: AnalyticsPageClientProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfDay(subMonths(new Date(), 1)),
    end: endOfDay(new Date())
  })
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([])
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [employees, setEmployees] = useState(initialEmployees)
  const [userRoles, setUserRoles] = useState(initialUserRoles)
  const [showDataTable, setShowDataTable] = useState(false)

  // Filter data based on date range and selected organizations
  const filteredData = useMemo(() => {
    let filteredOrgs = organizations.filter(org => {
      const orgDate = new Date(org.created_at)
      return orgDate >= dateRange.start && orgDate <= dateRange.end
    })

    if (selectedOrganizations.length > 0) {
      filteredOrgs = filteredOrgs.filter(org => selectedOrganizations.includes(org.id))
    }

    const orgIds = filteredOrgs.map(org => org.id)
    const filteredEmps = employees.filter(emp => {
      const empDate = new Date(emp.created_at)
      return empDate >= dateRange.start && 
             empDate <= dateRange.end &&
             (orgIds.length === 0 || orgIds.includes(emp.organization_id))
    })

    const filteredUsers = userRoles.filter(ur => {
      const userDate = new Date(ur.created_at)
      return userDate >= dateRange.start && userDate <= dateRange.end
    })

    return { filteredOrgs, filteredEmps, filteredUsers }
  }, [organizations, employees, userRoles, dateRange, selectedOrganizations])

  // Calculate statistics
  const stats = useMemo(() => {
    const { filteredOrgs, filteredEmps, filteredUsers } = filteredData
    const totalOrgs = filteredOrgs.length
    const activeOrgs = filteredOrgs.filter(org => org.is_active && org.status === 'active').length
    const totalEmployees = filteredEmps.length
    const totalUsers = filteredUsers.length

    // Recent activity (last 30 days)
    const thirtyDaysAgo = subMonths(new Date(), 1)
    const recentOrgs = filteredOrgs.filter(org => 
      new Date(org.created_at) >= thirtyDaysAgo
    ).length
    const recentEmployees = filteredEmps.filter(emp => 
      new Date(emp.created_at) >= thirtyDaysAgo
    ).length

    return { totalOrgs, activeOrgs, totalEmployees, totalUsers, recentOrgs, recentEmployees }
  }, [filteredData])

  // Prepare chart data
  const chartData = useMemo(() => {
    const { filteredOrgs, filteredEmps } = filteredData
    
    // Calculate months for the selected date range
    const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end })
    
    const orgsGrowth = months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const count = filteredOrgs.filter(org => {
        const orgDate = new Date(org.created_at)
        return orgDate >= monthStart && orgDate <= monthEnd
      }).length
      
      return {
        month: format(month, 'MMM yyyy', { locale: he }),
        ארגונים: count
      }
    })

    const employeesGrowth = months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const count = filteredEmps.filter(emp => {
        const empDate = new Date(emp.created_at)
        return empDate >= monthStart && empDate <= monthEnd
      }).length
      
      return {
        month: format(month, 'MMM yyyy', { locale: he }),
        עובדים: count
      }
    })

    // Top organizations by employee count
    const orgsWithEmployeeCount = filteredOrgs.map(org => {
      const empCount = filteredEmps.filter(emp => emp.organization_id === org.id).length
      return {
        ...org,
        employeeCount: empCount
      }
    }).sort((a, b) => b.employeeCount - a.employeeCount).slice(0, 10)

    const topOrgsChart = orgsWithEmployeeCount.map(org => ({
      name: org.name.length > 15 ? org.name.substring(0, 15) + '...' : org.name,
      עובדים: org.employeeCount
    }))

    // Users distribution by role
    const roleDistribution = filteredData.filteredUsers.reduce((acc: Record<string, number>, role) => {
      const roleName = role.role
      acc[roleName] = (acc[roleName] || 0) + 1
      return acc
    }, {})

    const roleChartData = Object.entries(roleDistribution).map(([role, count]) => ({
      name: role === 'super_admin' ? 'Super Admin' : 
            role === 'organization_admin' ? 'מנהל ארגון' :
            role === 'manager' ? 'מנהל' : 'עובד',
      value: count
    }))

    // Organizations by subscription tier
    const tierDistribution = filteredOrgs.reduce((acc: Record<string, number>, org) => {
      const tier = org.subscription_tier || 'basic'
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {})

    const tierChartData = Object.entries(tierDistribution).map(([tier, count]) => ({
      name: tier === 'basic' ? 'בסיסי' : 
            tier === 'professional' ? 'מקצועי' : 'ארגוני',
      value: count
    }))

    // Active vs Inactive organizations
    const activeVsInactive = [
      { name: 'פעילים', value: stats.activeOrgs, color: '#00A896' },
      { name: 'לא פעילים', value: stats.totalOrgs - stats.activeOrgs, color: '#94A3B8' }
    ]

    return {
      orgsGrowth,
      employeesGrowth,
      topOrgsChart,
      activeVsInactive,
      roleChartData,
      tierChartData
    }
  }, [filteredData, dateRange, stats])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Refresh data from server
      const [orgsRes, empsRes, usersRes] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, organization_id, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('role, created_at')
      ])

      if (orgsRes.data) setOrganizations(orgsRes.data)
      if (empsRes.data) setEmployees(empsRes.data)
      if (usersRes.data) setUserRoles(usersRes.data)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const { filteredOrgs, filteredEmps, filteredUsers } = filteredData
    
    // Enrich data for export
    const enrichedOrgs = filteredOrgs.map(org => ({
      ...org,
      employeeCount: filteredEmps.filter(emp => emp.organization_id === org.id).length
    }))

    exportAnalyticsData({
      organizations: enrichedOrgs,
      employees: filteredEmps,
      users: filteredUsers,
      stats,
      dateRange
    })
  }

  const availableOrganizations = organizations.map(org => ({
    id: org.id,
    name: org.name
  }))

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">אנליטיקה</h1>
              <p className="text-sm text-text-secondary">ניתוח נתונים וסטטיסטיקות מתקדם</p>
            </div>
          </div>
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Table2 className="h-4 w-4" />
            {showDataTable ? 'הסתר טבלה' : 'הצג טבלה'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <AnalyticsFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedOrganizations={selectedOrganizations}
          availableOrganizations={availableOrganizations}
          onOrganizationsChange={setSelectedOrganizations}
          onExport={handleExport}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">סה״כ ארגונים</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalOrgs}</p>
          <p className="text-xs text-text-muted mt-1">{stats.activeOrgs} פעילים</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">סה״כ עובדים</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalEmployees}</p>
          <p className="text-xs text-text-muted mt-1">{stats.recentEmployees} החודש</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">סה״כ משתמשים</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
          <p className="text-xs text-text-muted mt-1">משתמשים רשומים</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">פעילות החודש</p>
          <p className="text-2xl font-bold text-text-primary">{stats.recentOrgs}</p>
          <p className="text-xs text-text-muted mt-1">ארגונים חדשים</p>
        </div>
      </div>

      {/* Data Table */}
      {showDataTable && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-text-primary mb-4">נתונים מפורטים</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">ארגון</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">מספר עובדים</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">רמת מנוי</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">סטטוס</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">תאריך יצירה</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.filteredOrgs.map((org) => {
                  const empCount = filteredData.filteredEmps.filter(emp => emp.organization_id === org.id).length
                  return (
                    <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-text-primary font-medium">{org.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{empCount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {org.subscription_tier || 'basic'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          org.status === 'active' && org.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {org.status === 'active' && org.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: he })}
                      </td>
                    </tr>
                  )
                })}
                {filteredData.filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary">
                      אין נתונים לתקופה הנבחרת
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <AnalyticsCharts
        orgsGrowth={chartData.orgsGrowth}
        employeesGrowth={chartData.employeesGrowth}
        topOrgsChart={chartData.topOrgsChart}
        activeVsInactive={chartData.activeVsInactive}
        roleChartData={chartData.roleChartData}
        tierChartData={chartData.tierChartData}
      />
    </div>
  )
}
