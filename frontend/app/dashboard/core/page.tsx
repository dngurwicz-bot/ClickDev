'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, Settings, Briefcase, Activity, Clock, Wand2 } from 'lucide-react'
import SetupWizard from '@/components/core/SetupWizard'
import Link from 'next/link'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface DashboardStats {
    unitsCount: number
    titlesCount: number
    gradesCount: number
}

interface RecentActivity {
    id: string
    field_name: string
    new_value: string | null
    old_value: string | null
    created_at: string
    changer: {
        email: string
    } | null
    unit?: {
        name: string
    }
}

export default function CoreDashboard() {
    const { currentOrg } = useOrganization()
    const [stats, setStats] = useState<DashboardStats>({ unitsCount: 0, titlesCount: 0, gradesCount: 0 })
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [showWizard, setShowWizard] = useState(false)

    useEffect(() => {
        if (!currentOrg) return

        const fetchDashboardData = async () => {
            setLoading(true)
            try {
                const { count: unitsCount } = await supabase.from('org_units').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id)

                // Job titles and grades might not have RLS setup for viewer correctly or table might be empty
                // Let's wrap them in try catch to avoid breaking the dashboard
                let titlesCount = 0
                let gradesCount = 0

                try {
                    const { count } = await supabase.from('job_titles').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id)
                    titlesCount = count || 0
                } catch (e) { console.error('Titles count error', e) }

                try {
                    const { count } = await supabase.from('job_grades').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id)
                    gradesCount = count || 0
                } catch (e) { console.error('Grades count error', e) }

                setStats({
                    unitsCount: unitsCount || 0,
                    titlesCount,
                    gradesCount,
                })

                // Fetch Recent Activity (Org Unit History)
                // Note: Join is tricky with history tables if not setup correctly. simpler query first.
                // We need to fetch history and manually link or use a view. 
                // Let's try simple fetch first.
                const { data: historyData, error } = await supabase
                    .from('org_unit_history')
                    .select(`
                        id, 
                        field_name, 
                        new_value, 
                        old_value, 
                        created_at,
                        unit:org_units(name)
                    `)
                    .eq('organization_id', currentOrg.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (historyData) {
                    setActivities(historyData as any)
                }

            } catch (err) {
                console.error('Error loading dashboard:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [currentOrg])

    if (loading) return <div className="p-8">טוען נתונים...</div>

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">סקירה כללית</h1>
                <p className="text-gray-500">ניהול הליבה הארגונית: מבנה, תפקידים ועובדים.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500">יחידות ארגוניות</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900">{stats.unitsCount}</h3>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                </Card>


                <Card className="p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500">תפקידים מוגדרים</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900">{stats.titlesCount}</h3>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Briefcase className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500">דרגות שכר</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900">{stats.gradesCount}</h3>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                        <Activity className="w-6 h-6" />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        פעולות מהירות
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <Link href="/dashboard/core/employees/new">
                            <Card className="p-6 hover:bg-gray-50 transition-colors cursor-pointer border-r-4 border-r-green-500">
                                <h3 className="font-bold text-lg mb-2">הקמת עובד חדש</h3>
                                <p className="text-sm text-gray-500">הוספת עובד חדש לארגון עם נתוני בסיס (Table 001).</p>
                            </Card>
                        </Link>

                        <Link href="/dashboard/core/settings">
                            <Card className="p-6 hover:bg-gray-50 transition-colors cursor-pointer border-r-4 border-r-purple-500">
                                <h3 className="font-bold text-lg mb-2">הגדרות תפקידים</h3>
                                <p className="text-sm text-gray-500">ניהול קטלוג תפקידים, דרגות ורמות היררכיה.</p>
                            </Card>
                        </Link>

                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        פעילות אחרונה
                    </h2>
                    <Card className="p-0 overflow-hidden">
                        {activities.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {activities.map(activity => (
                                    <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="text-sm font-medium text-gray-900">
                                            שינוי ב-{activity.unit?.name || 'יחידה לא ידועה'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            עודכן שדה <span className="font-semibold">{translateField(activity.field_name)}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 flex justify-between">
                                            <span>{format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                אין פעילות אחרונה להצגה
                            </div>
                        )}
                        <div className="p-3 bg-gray-50 text-center border-t text-xs text-blue-600 hover:underline cursor-pointer">
                            צפה בכל ההיסטוריה
                        </div>
                    </Card>
                </div>
            </div>
            <SetupWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
            />
        </div>
    )
}

function translateField(field: string) {
    const map: Record<string, string> = {
        name: 'שם יחידה',
        manager_id: 'מנהל יחידה',
        parent_id: 'יחידת אם',
        type: 'סוג יחידה'
    }
    return map[field] || field
}
