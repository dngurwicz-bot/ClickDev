'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'
import { usePathname, useRouter } from 'next/navigation'
import { Clock3, History, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import type { ActiveScreen } from '@/lib/types/models'
import { fetchActiveScreens, removeActiveScreen } from '@/lib/screen-lifecycle/activeScreensApi'

const HIDDEN_ROUTE_PREFIXES = ['/login', '/forgot-password', '/auth', '/unauthorized']

function normalizeRoute(route: string) {
    if (!route) return '/'
    const [base] = route.split(/[?#]/)
    if (!base || base === '/') return '/'
    return base.endsWith('/') ? base.slice(0, -1) : base
}

function isVisibleRoute(route: string) {
    return !HIDDEN_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix))
}

function formatRouteLabel(route: string) {
    if (!route || route === '/') return 'דף הבית'
    return route
        .split('/')
        .filter(Boolean)
        .map((part) => {
            if (part === 'dashboard') return 'לוח בקרה'
            if (part === 'core') return 'ליבה'
            if (part === 'admin') return 'ניהול'
            return part.replace(/-/g, ' ')
        })
        .join(' / ')
}

export function AppBottomDock() {
    const { history } = useNavigationStack()
    const { currentOrg } = useOrganization()
    const router = useRouter()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [activeScreens, setActiveScreens] = useState<ActiveScreen[]>([])
    const normalizedPathname = useMemo(() => normalizeRoute(pathname || ''), [pathname])

    const recentScreens = useMemo(() => {
        const normalized = history
            .map(normalizeRoute)
            .filter((route) => isVisibleRoute(route))

        const unique: string[] = []
        for (let i = normalized.length - 1; i >= 0; i -= 1) {
            const route = normalized[i]
            if (!unique.includes(route)) unique.push(route)
            if (unique.length >= 5) break
        }

        return unique.map((route) => ({
            route,
            label: formatRouteLabel(route),
        }))
    }, [history])

    useEffect(() => {
        if (!currentOrg?.id) return

        const load = async () => {
            try {
                const items = await fetchActiveScreens(currentOrg.id)
                setActiveScreens(items)
            } catch (err) {
                console.error('Failed to load active screens', err)
            }
        }

        load()
        if (!isOpen) return

        const interval = setInterval(load, 20000)
        return () => clearInterval(interval)
    }, [currentOrg?.id, isOpen, normalizedPathname])

    useEffect(() => {
        recentScreens.forEach((screen) => {
            if (screen.route !== normalizedPathname) {
                router.prefetch(screen.route)
            }
        })
    }, [recentScreens, normalizedPathname, router])

    const navigateTo = (route: string) => {
        if (!route) return
        if (normalizeRoute(route) === normalizedPathname) {
            setIsOpen(false)
            return
        }
        setIsOpen(false)
        router.push(route)
    }

    const closeScreen = async (screenId: string) => {
        if (!currentOrg?.id) return
        try {
            await removeActiveScreen(currentOrg.id, screenId)
            const items = await fetchActiveScreens(currentOrg.id)
            setActiveScreens(items)
        } catch (err) {
            console.error('Failed to close active screen', err)
        }
    }

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[120] border-t border-[#D5E2EA] bg-[#F8FBFD]/95 backdrop-blur">
                <div className="mx-auto flex h-10 w-full max-w-[1600px] items-center justify-end px-3 sm:px-5" dir="rtl">
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                            isOpen
                                ? 'border-[#2B7AAA] bg-[#E6F2F8] text-[#174765]'
                                : 'border-[#C8DBE7] bg-white text-[#1F4964] hover:bg-[#EEF6FB]'
                        )}
                    >
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>מסכים פעילים</span>
                        <span className="rounded-full bg-[#2B7AAA] px-1.5 py-0 text-[10px] font-bold text-white">
                            {Math.max(activeScreens.length, recentScreens.length)}
                        </span>
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="fixed bottom-11 right-3 z-[130] w-[360px] overflow-hidden rounded-lg border border-[#C7DCE8] bg-white shadow-xl sm:right-5" dir="rtl">
                    <div className="flex items-center justify-between border-b border-[#E2EEF5] bg-[#F4FAFE] px-3 py-2">
                        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1D4D6A]">
                            <History className="h-3.5 w-3.5" />
                            <span>מסכים פעילים</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded p-1 text-[#5A7A90] transition-colors hover:bg-[#E8F3F9] hover:text-[#1D4D6A]"
                            aria-label="סגירת חלון מסכים פעילים"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="max-h-[240px] space-y-2 overflow-auto p-2">
                        {activeScreens.map((screen) => (
                            <div key={screen.id} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigateTo(screen.route)}
                                    className={cn(
                                        'flex-1 rounded px-2 py-1.5 text-right text-[11px] transition-colors',
                                        normalizeRoute(screen.route) === normalizedPathname
                                            ? 'bg-[#EAF4FB] font-semibold text-[#174765]'
                                            : 'text-[#2B4F65] hover:bg-[#EFF7FC]'
                                    )}
                                >
                                    {screen.title || formatRouteLabel(screen.route)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => closeScreen(screen.id)}
                                    className="rounded p-1 text-[#5A7A90] hover:bg-[#E8F3F9]"
                                    title="סגור מסך"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}

                        {!activeScreens.length && recentScreens.map((screen) => (
                            <button
                                key={screen.route}
                                type="button"
                                onClick={() => navigateTo(screen.route)}
                                className={cn(
                                    'w-full rounded px-2 py-1.5 text-right text-[11px] transition-colors',
                                    screen.route === normalizedPathname
                                        ? 'bg-[#EAF4FB] font-semibold text-[#174765]'
                                        : 'text-[#2B4F65] hover:bg-[#EFF7FC]'
                                )}
                            >
                                {screen.label}
                            </button>
                        ))}

                        {!activeScreens.length && !recentScreens.length && (
                            <p className="px-2 py-2 text-[11px] text-[#6B8799]">עדיין אין מסכים פעילים להצגה.</p>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
