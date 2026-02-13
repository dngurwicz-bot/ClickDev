'use client'

import React from 'react'
import { Building2, User, Bell, ShieldAlert, Workflow, FileText, Network, Laptop, Heart, TrendingUp, BarChart3 } from 'lucide-react'
import { PriorityDashboardTile } from '@/components/dashboard/PriorityDashboardTile'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'
import { createShortcut, createShortcutGroup, getRecentUpdates, getUiHomeConfig, saveUiHomeConfig } from '@/lib/api'
import { ShortcutGroupsPanel } from '@/components/dashboard/ShortcutGroupsPanel'
import { HomeWidgetsPanel } from '@/components/dashboard/HomeWidgetsPanel'
import { RecentUpdatesPanel } from '@/components/dashboard/RecentUpdatesPanel'
import type { ShortcutGroup } from '@/lib/types/models'

const BASE_TILES = [
    { label: 'Click Core', href: '/dashboard/core', icon: Building2 },
    { label: 'CLICK Flow', href: '/dashboard/flow', icon: Workflow, moduleKey: 'flow' },
    { label: 'CLICK Docs', href: '/dashboard/docs', icon: FileText, moduleKey: 'docs' },
    { label: 'CLICK Vision', href: '/dashboard/vision', icon: Network, moduleKey: 'vision' },
    { label: 'CLICK Assets', href: '/dashboard/assets', icon: Laptop, moduleKey: 'assets' },
    { label: 'CLICK Vibe', href: '/dashboard/vibe', icon: Heart, moduleKey: 'vibe' },
    { label: 'CLICK Grow', href: '/dashboard/grow', icon: TrendingUp, moduleKey: 'grow' },
    { label: 'CLICK Insights', href: '/dashboard/insights', icon: BarChart3, moduleKey: 'insights' },
    { label: 'פרופיל משתמש', href: '/dashboard/profile', icon: User },
    { label: 'הודעות מערכת', href: '/announcements', icon: Bell },
]

export default function DashboardPage() {
    const { currentOrg } = useOrganization()
    const [isAdmin, setIsAdmin] = React.useState(false)
    const [displayName, setDisplayName] = React.useState('משתמש')
    const [widgetConfig, setWidgetConfig] = React.useState<Record<string, unknown>>({})
    const [shortcutGroups, setShortcutGroups] = React.useState<ShortcutGroup[]>([])
    const [counters, setCounters] = React.useState({ employees: 0, org_units: 0, positions: 0 })
    const [recentUpdates, setRecentUpdates] = React.useState<any[]>([])

    const loadHomeData = React.useCallback(async () => {
        if (!currentOrg?.id) return
        try {
            const [home, updates] = await Promise.all([
                getUiHomeConfig(currentOrg.id),
                getRecentUpdates(currentOrg.id, 30, 20),
            ])
            setWidgetConfig(home.widgets_json || {})
            setShortcutGroups(home.shortcut_groups || [])
            setCounters(home.counters || { employees: 0, org_units: 0, positions: 0 })
            setRecentUpdates(updates || [])
        } catch (error) {
            console.error('Failed loading dashboard home data', error)
        }
    }, [currentOrg?.id])

    React.useEffect(() => {
        const loadUserContext = async () => {
            const [{ data: { user } }, admin] = await Promise.all([
                supabase.auth.getUser(),
                isSuperAdmin(),
            ])

            setIsAdmin(admin)
            const name = user?.user_metadata?.first_name || user?.email?.split('@')[0]
            if (name) setDisplayName(name)
        }

        loadUserContext()
    }, [])

    React.useEffect(() => {
        loadHomeData()
    }, [loadHomeData])

    const visibleTiles = BASE_TILES.filter((tile: any) => {
        if (!tile.moduleKey && tile.href !== '/dashboard/core') return true
        if (!currentOrg?.active_modules) return true
        return currentOrg.active_modules.includes(tile.moduleKey || 'core')
    })

    if (isAdmin) {
        visibleTiles.push({ label: 'ניהול מערכת', href: '/admin/dashboard', icon: ShieldAlert })
    }

    return (
        <div className="mx-auto max-w-7xl p-6" dir="rtl">
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">תפריט ראשי</h1>
                    <p className="mt-1 text-sm text-gray-500">שלום, {displayName}</p>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                {visibleTiles.map((tile) => (
                    <PriorityDashboardTile key={tile.href} {...tile} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ShortcutGroupsPanel
                        groups={shortcutGroups}
                        onCreateGroup={async (name) => {
                            if (!currentOrg?.id) return
                            await createShortcutGroup(currentOrg.id, name, shortcutGroups.length)
                            await loadHomeData()
                        }}
                        onCreateShortcut={async (groupId, label, route) => {
                            if (!currentOrg?.id) return
                            const group = shortcutGroups.find((g) => g.id === groupId)
                            await createShortcut(currentOrg.id, {
                                group_id: groupId,
                                entity_type: 'screen',
                                entity_key: route,
                                label,
                                route,
                                display_order: (group?.shortcuts || []).length,
                            })
                            await loadHomeData()
                        }}
                    />
                </div>
                <RecentUpdatesPanel items={recentUpdates} />
            </div>

            <div className="mt-4">
                <HomeWidgetsPanel
                    widgets={widgetConfig}
                    counters={counters}
                    onChange={async (nextWidgets) => {
                        setWidgetConfig(nextWidgets)
                        if (!currentOrg?.id) return
                        await saveUiHomeConfig(currentOrg.id, nextWidgets)
                    }}
                />
            </div>
        </div>
    )
}
