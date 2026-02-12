'use client'

import React from 'react'
import {
    Building2,
    User,
    Bell,
    ShieldAlert,
} from 'lucide-react'
import { PriorityDashboardTile } from '@/components/dashboard/PriorityDashboardTile'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'

const BASE_TILES = [
    { label: 'Click Core', href: '/dashboard/core', icon: Building2 },
    { label: 'פרופיל משתמש', href: '/dashboard/profile', icon: User },
    { label: 'הודעות מערכת', href: '/announcements', icon: Bell },
]

export default function DashboardPage() {
    const { currentOrg } = useOrganization()
    const [isAdmin, setIsAdmin] = React.useState(false)
    const [displayName, setDisplayName] = React.useState('משתמש')

    React.useEffect(() => {
        const loadUserContext = async () => {
            const [{ data: { user } }, admin] = await Promise.all([
                supabase.auth.getUser(),
                isSuperAdmin()
            ])

            setIsAdmin(admin)
            const name = user?.user_metadata?.first_name || user?.email?.split('@')[0]
            if (name) setDisplayName(name)
        }

        loadUserContext()
    }, [])

    const visibleTiles = BASE_TILES.filter(tile => {
        if (tile.href !== '/dashboard/core') return true
        if (!currentOrg?.active_modules) return true
        return currentOrg.active_modules.includes('core')
    })

    if (isAdmin) {
        visibleTiles.push({ label: 'ניהול מערכת', href: '/admin/dashboard', icon: ShieldAlert })
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Welcome / Context Strip */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">תפריט ראשי</h1>
                    <p className="text-sm text-gray-500 mt-1">שלום, {displayName}</p>
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
