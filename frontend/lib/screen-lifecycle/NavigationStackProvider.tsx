'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { sendActiveScreenHeartbeat } from './activeScreensApi'

interface NavigationStackContextValue {
    history: string[]
    previousScreen: string | null
    goBackOrFallback: (fallbackRoute: string) => void
    closeScreen: (route: string, fallbackRoute?: string) => void
}

const NavigationStackContext = createContext<NavigationStackContextValue | undefined>(undefined)

const MAX_HISTORY = 100

export function NavigationStackProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { currentOrg } = useOrganization()
    const [history, setHistory] = useState<string[]>([])

    const currentRoute = useMemo(() => pathname, [pathname])

    useEffect(() => {
        setHistory(prev => {
            if (prev[prev.length - 1] === currentRoute) return prev

            const next = [...prev, currentRoute]
            if (next.length > MAX_HISTORY) {
                return next.slice(next.length - MAX_HISTORY)
            }
            return next
        })
    }, [currentRoute])

    useEffect(() => {
        if (!currentOrg?.id || !currentRoute) return

        const postHeartbeat = () => {
            void sendActiveScreenHeartbeat(currentOrg.id, currentRoute, currentRoute, document.title || currentRoute)
        }

        postHeartbeat()
        const interval = setInterval(postHeartbeat, 25000)
        return () => clearInterval(interval)
    }, [currentOrg?.id, currentRoute])

    const goBackOrFallback = useCallback((fallbackRoute: string) => {
        if (history.length > 1) {
            const next = history.slice(0, -1)
            const previous = next[next.length - 1]
            setHistory(next)
            router.push(previous)
            return
        }

        router.push(fallbackRoute)
    }, [history, router])

    const closeScreen = useCallback((route: string, fallbackRoute = '/dashboard') => {
        if (!route) return
        const next = history.filter((entry) => entry !== route)
        const isClosingCurrent = currentRoute === route

        setHistory(next)

        if (isClosingCurrent) {
            const target = next[next.length - 1] || fallbackRoute
            router.push(target)
        }
    }, [currentRoute, history, router])

    const previousScreen = history.length > 1 ? history[history.length - 2] : null

    return (
        <NavigationStackContext.Provider value={{ history, previousScreen, goBackOrFallback, closeScreen }}>
            {children}
        </NavigationStackContext.Provider>
    )
}

export function useNavigationStack() {
    const context = useContext(NavigationStackContext)
    if (!context) {
        throw new Error('useNavigationStack must be used within a NavigationStackProvider')
    }
    return context
}
