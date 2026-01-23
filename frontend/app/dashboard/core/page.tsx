'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
    GitGraph,
    Network,
    Briefcase,
    GraduationCap,
    ChevronRight,
    Users
} from 'lucide-react'

export default function CoreDashboard() {
    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Click Core</h1>
                <p className="text-gray-500">ניהול המבנה הארגוני, תפקידים והיסטוריה ארגונית</p>
            </div>

            {/* Quick Actions / Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group border-t-4 border-t-blue-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Network className="w-6 h-6 text-blue-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">מבנה ארגוני</h3>
                    <p className="text-sm text-gray-500">ניהול היררכיה, אגפים ומחלקות</p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group border-t-4 border-t-indigo-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Briefcase className="w-6 h-6 text-indigo-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">תפקידים</h3>
                    <p className="text-sm text-gray-500">ניהול תקנים, איוש ומשרות</p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group border-t-4 border-t-purple-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">קטלוג משרות</h3>
                    <p className="text-sm text-gray-500">דרגות, תיאורי תפקיד ודרישות</p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group border-t-4 border-t-amber-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                            <GitGraph className="w-6 h-6 text-amber-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">היסטוריה (Time Machine)</h3>
                    <p className="text-sm text-gray-500">צפייה בשינויים ארגוניים לאורך זמן</p>
                </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">פעילות אחרונה בליבה</h3>
                <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>אין פעילות אחרונה להצגה</p>
                </div>
            </Card>
        </div>
    )
}
