'use client'

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'

interface SidebarItem {
    id: string
    label: string
    href?: string
    onClick?: () => void
}

interface SidebarStateContextType {
    customItems: SidebarItem[]
}

interface SidebarActionsContextType {
    setCustomItems: (items: SidebarItem[]) => void
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined)
const SidebarActionsContext = createContext<SidebarActionsContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [customItems, setCustomItems] = useState<SidebarItem[]>([])

    // Stable pointer to the setter
    const setCustomItemsCallback = useCallback((items: SidebarItem[]) => {
        setCustomItems(items)
    }, [])

    const stateValue = useMemo(() => ({ customItems }), [customItems])
    const actionsValue = useMemo(() => ({ setCustomItems: setCustomItemsCallback }), [setCustomItemsCallback])

    return (
        <SidebarStateContext.Provider value={stateValue}>
            <SidebarActionsContext.Provider value={actionsValue}>
                {children}
            </SidebarActionsContext.Provider>
        </SidebarStateContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarStateContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}

export function useSidebarActions() {
    const context = useContext(SidebarActionsContext)
    if (context === undefined) {
        throw new Error('useSidebarActions must be used within a SidebarProvider')
    }
    return context
}
