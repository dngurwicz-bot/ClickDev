'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface NavigationStackContextValue {
    history: string[]
    previousScreen: string | null
    goBackOrFallback: (fallbackRoute: string) => void
}

const NavigationStackContext = createContext<NavigationStackContextValue | undefined>(undefined)

const MAX_HISTORY = 100

export function NavigationStackProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
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

    const goBackOrFallback = useCallback((fallbackRoute: string) => {
        setHistory(prev => {
            if (prev.length > 1) {
                const next = prev.slice(0, -1)
                const previous = next[next.length - 1]
                router.push(previous)
                return next
            }

            router.push(fallbackRoute)
            return prev
        })
    }, [router])

    const previousScreen = history.length > 1 ? history[history.length - 2] : null

    return (
        <NavigationStackContext.Provider value={{ history, previousScreen, goBackOrFallback }}>
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
