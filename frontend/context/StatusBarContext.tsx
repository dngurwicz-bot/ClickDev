'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

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
    const [recordStatus, setRecordStatus] = useState<RecordStatus | null>(null)

    const value = useMemo(() => ({
        recordStatus,
        setRecordStatus,
    }), [recordStatus])

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
