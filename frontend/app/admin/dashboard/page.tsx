'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, TrendingUp, Activity } from 'lucide-react'
import StatsCard from '@/components/admin/StatsCard'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalEmployees: 0,
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
      
      if (!session?.access_token) {
        throw new Error('No session')
      }

      const response = await fetch('http://localhost:8000/api/stats/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const data = await response.json()
      setStats({
        totalOrganizations: data.total_organizations || 0,
        activeOrganizations: data.active_organizations || 0,
        totalEmployees: data.total_employees || 0,
        recentActivity: []
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">דשבורד</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          title="סה״כ עובדים"
          value={stats.totalEmployees}
          icon={Users}
          color="info"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">פעילות אחרונה</h2>
        <div className="text-text-secondary">
          אין פעילות אחרונה להצגה
        </div>
      </div>
    </div>
  )
}
