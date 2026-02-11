'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Users, TrendingUp, Activity, AlertCircle, Download } from 'lucide-react'
import StatsCard from '@/components/admin/analytics/StatsCard'
import GrowthChart from '@/components/admin/analytics/GrowthChart'
import DistributionChart from '@/components/admin/analytics/DistributionChart'
import ReportsModal from '@/components/admin/analytics/ReportsModal'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReportsModal, setShowReportsModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/stats/analytics`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) throw new Error('Failed to fetch analytics data')

      const jsonData = await res.json()
      setData(jsonData)
    } catch (err) {
      console.error(err)
      setError('שגיאה בטעינת נתונים')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 ml-2" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">אנליטיקס</h1>
          <p className="text-text-secondary">סקירה מקיפה של ביצועי המערכת</p>
        </div>
        <button
          onClick={() => setShowReportsModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          <Download className="w-4 h-4" />
          הפקת דוחות
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="סה״כ ארגונים"
          value={data?.metrics?.total_orgs || 0}
          icon={Building2}
          color="blue"
          trend={{ value: 12, label: "מהחודש שעבר", positive: true }}
        />
        <StatsCard
          title="סה״כ עובדים"
          value={data?.metrics?.avg_employees_per_org ? Math.round(data?.metrics?.avg_employees_per_org * data?.metrics?.total_orgs) : 0}
          icon={Users}
          color="purple"
          trend={{ value: 8, label: "מהחודש שעבר", positive: true }}
        />
        <StatsCard
          title="אחוז נטישה"
          value={`${data?.metrics?.churn_rate}%`}
          icon={Activity}
          color="red"
          trend={{ value: 2, label: "מהחודש שעבר", positive: false }}
        />
        <StatsCard
          title="ממוצע עובדים לארגון"
          value={data?.metrics?.avg_employees_per_org || 0}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GrowthChart data={data?.growth_data || []} />
        </div>
        <div className="lg:col-span-1">
          <DistributionChart data={data?.distribution_data || []} />
        </div>
      </div>

      {showReportsModal && (
        <ReportsModal onClose={() => setShowReportsModal(false)} />
      )}
    </div>
  )
}
