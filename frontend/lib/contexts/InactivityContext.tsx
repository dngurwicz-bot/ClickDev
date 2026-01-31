'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface InactivityContextType {
    lastActivity: number
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined)

const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
// const TIMEOUT_MS = 10000 // 10 seconds for testing

export function InactivityProvider({ children }: { children: ReactNode }) {
    const [lastActivity, setLastActivity] = useState(Date.now())
    const router = useRouter()
    const pathname = usePathname()
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // List of public paths where we shouldn't enforce inactivity timeout
    const publicPaths = ['/login', '/forgot-password', '/update-password', '/unauthorized']
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path))

    const handleActivity = () => {
        setLastActivity(Date.now())
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login?message=session_expired')
            router.refresh()
        } catch (error) {
            console.error('Error signing out due to inactivity:', error)
            // Force redirect even if sign out fails
            router.push('/login?message=session_expired')
        }
    }

    useEffect(() => {
        if (isPublicPath) return

        // Events to track
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

        // reset timer function
        const resetTimer = () => {
            handleActivity()
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            timerRef.current = setTimeout(handleLogout, TIMEOUT_MS)
        }

        // Set initial timer
        resetTimer()

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        })

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer)
            })
        }
    }, [pathname, isPublicPath, router])

    return (
        <InactivityContext.Provider value={{ lastActivity }}>
            {children}
        </InactivityContext.Provider>
    )
}

export const useInactivity = () => {
    const context = useContext(InactivityContext)
    if (context === undefined) {
        throw new Error('useInactivity must be used within an InactivityProvider')
    }
    return context
}
