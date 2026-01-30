'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, TrendingUp, Activity } from 'lucide-react'
import StatsCard from '@/components/admin/StatsCard'
import TasksWidget from '@/components/admin/TasksWidget'
import GlobalLoader from '@/components/ui/GlobalLoader'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    mrr: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      console.log('[Dashboard] Session check:', session ? 'Session exists' : 'No session')

      // Display user ID for super_admin assignment
      if (session?.user) {
        console.log('═══════════════════════════════════════════════════════════')
        console.log('YOUR USER ID (for super_admin assignment):')
        console.log(session.user.id)
        console.log('Email:', session.user.email)
        console.log('═══════════════════════════════════════════════════════════')
      }

      if (!session?.access_token) {
        console.error('[Dashboard] No access token found')
        throw new Error('No session')
      }

      console.log('[Dashboard] Fetching stats from backend...')
      const response = await fetch('http://127.0.0.1:8000/api/stats/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('[Dashboard] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Dashboard] Error response:', errorText)
        throw new Error(`Failed to fetch stats: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[Dashboard] Stats received:', data)
      setStats({
        totalOrganizations: data.total_organizations || 0,
        activeOrganizations: data.active_organizations || 0,
        mrr: data.mrr || 0,
        recentActivity: data.recent_activity || []
      })
    } catch (error) {
      console.error('[Dashboard] Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <GlobalLoader />
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">דשבורד</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="סה״כ ארגונים"
          value={stats.totalOrganizations}
          icon={Building2}
          color="primary"
        />
        <StatsCard
          title="ארגונים פעילים"
          value={stats.activeOrganizations}
          icon={Activity}
          color="success"
        />
        <StatsCard
          title="הכנסה חודשית (MRR)"
          value={`₪${stats.mrr?.toLocaleString()}`}
          icon={TrendingUp}
          color="warning"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-text-primary">ארגונים חדשים</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם הארגון</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((org: any) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-xs">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {org.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      אין פעילות אחרונה להצגה
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tasks Widget */}
        <TasksWidget />
      </div>
    </div>
  )
}
