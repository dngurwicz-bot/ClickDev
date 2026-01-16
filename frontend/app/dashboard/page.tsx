'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, FileText, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()
    }, [])

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        )
    }

    const stats = [
        { label: 'סה״כ עובדים', value: '12', icon: Users, color: 'bg-blue-500' },
        { label: 'מסמכים ממתינים', value: '3', icon: FileText, color: 'bg-orange-500' },
        { label: 'ימי חופשה החודש', value: '5', icon: Calendar, color: 'bg-green-500' },
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary">
                    שלום, {user?.user_metadata?.first_name || 'משתמש'} 👋
                </h1>
                <p className="text-text-secondary mt-2">ברוכים הבאים למערכת הניהול שלך</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-text-secondary text-sm font-medium mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${stat.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-primary">פעילות אחרונה</h2>
                </div>
                <div className="text-center py-12 text-text-secondary bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-text-muted" />
                    <p>אין פעילות אחרונה להצגה</p>
                </div>
            </div>
        </div>
    )
}
