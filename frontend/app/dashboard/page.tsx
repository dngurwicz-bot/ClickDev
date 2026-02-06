'use client'

import React from 'react'
import {
    Building2,
    Workflow,
    FileText,
    Eye,
    Package,
    Heart,
    TrendingUp,
    BarChart3
} from 'lucide-react'
import { PriorityDashboardTile } from '@/components/dashboard/PriorityDashboardTile'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

const DASHBOARD_TILES = [
    { label: 'Click Core', href: '/dashboard/core', icon: Building2 },
    { label: 'Click Flow', href: '/dashboard/flow', icon: Workflow },
    { label: 'Click Docs', href: '/dashboard/documents', icon: FileText },
    { label: 'Click Vision', href: '/dashboard/vision', icon: Eye },
    { label: 'Click Assets', href: '/dashboard/assets', icon: Package },
    { label: 'Click Vibe', href: '/dashboard/vibe', icon: Heart },
    { label: 'Click Grow', href: '/dashboard/grow', icon: TrendingUp },
    { label: 'Click Insights', href: '/dashboard/insights', icon: BarChart3 },
]

export default function DashboardPage() {
    const { currentOrg } = useOrganization()

    const visibleTiles = DASHBOARD_TILES.filter(tile => {
        const moduleKey = tile.href.split('/').pop()
        const actualKey = moduleKey === 'documents' ? 'docs' : moduleKey
        if (!currentOrg?.active_modules) return true
        return currentOrg.active_modules.includes(actualKey!)
    })

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Welcome / Context Strip */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">תפריט ראשי</h1>
                    <p className="text-sm text-gray-500 mt-1">שלום, דיאגו ג</p>
                </div>
            </div>

            {/* Dense Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {visibleTiles.map((tile) => (
                    <PriorityDashboardTile
                        key={tile.href}
                        {...tile}
                    />
                ))}
            </div>

            {/* "Recently Used" or widget area mimicking Priority's bottom area if any */}
            <div className="mt-12 text-center text-sm text-gray-400">
                {/* Visual filler for "System Notifications" or similar usually found in ERP dashboards */}
                <div className="border bg-white p-4 rounded-sm shadow-sm inline-block">
                    <span className="font-bold block text-secondary mb-1">הודעות מערכת</span>
                    אין הודעות חדשות
                </div>
            </div>
        </div>
    )
}
