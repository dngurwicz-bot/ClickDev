'use client'

import React, { createContext, useContext, useState } from 'react'

interface FocusContextType {
    focusedLabel: string | null
    setFocusedLabel: (label: string | null) => void
}

const FocusContext = createContext<FocusContextType | undefined>(undefined)

export function FocusProvider({ children }: { children: React.ReactNode }) {
    const [focusedLabel, setFocusedLabel] = useState<string | null>(null)

    return (
        <FocusContext.Provider value={{ focusedLabel, setFocusedLabel }}>
            {children}
        </FocusContext.Provider>
    )
}

export function useFocusContext() {
    const context = useContext(FocusContext)
    if (context === undefined) {
        throw new Error('useFocusContext must be used within a FocusProvider')
    }
    return context
}
