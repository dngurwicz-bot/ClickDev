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
    sidebarHidden: boolean
}

interface SidebarActionsContextType {
    setCustomItems: (items: SidebarItem[]) => void
    hideSidebar: () => void
    showSidebar: () => void
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined)
const SidebarActionsContext = createContext<SidebarActionsContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [customItems, setCustomItems] = useState<SidebarItem[]>([])
    const [sidebarHidden, setSidebarHidden] = useState(false)

    // Stable pointer to the setter
    const setCustomItemsCallback = useCallback((items: SidebarItem[]) => {
        setCustomItems(items)
    }, [])

    const hideSidebar = useCallback(() => setSidebarHidden(true), [])
    const showSidebar = useCallback(() => setSidebarHidden(false), [])

    const stateValue = useMemo(() => ({ customItems, sidebarHidden }), [customItems, sidebarHidden])
    const actionsValue = useMemo(() => ({
        setCustomItems: setCustomItemsCallback,
        hideSidebar,
        showSidebar
    }), [setCustomItemsCallback, hideSidebar, showSidebar])

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
