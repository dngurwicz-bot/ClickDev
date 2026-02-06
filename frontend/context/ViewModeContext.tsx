'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type ViewMode = 'table' | 'form'

interface ViewModeContextType {
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
    toggleViewMode: () => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
    const [viewMode, setViewMode] = useState<ViewMode>('table')

    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'table' ? 'form' : 'table')
    }, [])

    // Global F2 keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault()
                toggleViewMode()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [toggleViewMode])

    return (
        <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
            {children}
        </ViewModeContext.Provider>
    )
}

export function useViewMode() {
    const context = useContext(ViewModeContext)
    if (context === undefined) {
        throw new Error('useViewMode must be used within a ViewModeProvider')
    }
    return context
}
