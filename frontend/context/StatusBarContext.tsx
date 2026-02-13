'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface RecordStatus {
    label?: string
    current: number
    total: number
}

interface StatusBarContextType {
    recordStatus: RecordStatus | null
    setRecordStatus: (status: RecordStatus | null) => void
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined)

export function StatusBarProvider({ children }: { children: React.ReactNode }) {
    const [recordStatus, setRecordStatusState] = useState<RecordStatus | null>(null)

    const setRecordStatus = useCallback((status: RecordStatus | null) => {
        setRecordStatusState((prev) => {
            if (prev === status) return prev
            if (!prev && !status) return prev
            if (!prev || !status) return status
            if (prev.label === status.label && prev.current === status.current && prev.total === status.total) {
                return prev
            }
            return status
        })
    }, [])

    const value = useMemo(() => ({
        recordStatus,
        setRecordStatus,
    }), [recordStatus, setRecordStatus])

    return (
        <StatusBarContext.Provider value={value}>
            {children}
        </StatusBarContext.Provider>
    )
}

export function useStatusBar() {
    const context = useContext(StatusBarContext)
    if (!context) {
        throw new Error('useStatusBar must be used within a StatusBarProvider')
    }
    return context
}
