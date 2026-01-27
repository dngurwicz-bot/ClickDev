'use client'

import { ReactNode, useEffect } from 'react'
import { useSidebarActions } from '@/lib/contexts/SidebarContext'

interface SideMenuItem {
    id: string
    label: string
    icon?: any
    code?: string // e.g. "203"
}

interface HilanModuleLayoutProps {
    children: ReactNode
    menuItems: SideMenuItem[]
    activeItemId: string
    onItemSelect: (id: string) => void
    title?: string // Title of the current view (e.g. "Event 527 - Personal Components")
    onOverviewClick?: () => void
}

export function HilanModuleLayout({
    children,
    menuItems,
    activeItemId,
    onItemSelect,
    title,
    onOverviewClick
}: HilanModuleLayoutProps) {
    const { setCustomItems } = useSidebarActions()

    useEffect(() => {
        const items = [
            ...(onOverviewClick ? [{
                id: 'overview-nav',
                label: 'תקציר',
                onClick: onOverviewClick
            }] : []),
            ...menuItems.map((item) => ({
                id: item.id,
                label: `${item.code ? item.code + ' - ' : ''}${item.label}`,
                onClick: () => onItemSelect(item.id)
            }))
        ]
        setCustomItems(items)
        // Cleanup is handled by EmployeeProfileLayout or when switching tabs
    }, [menuItems, activeItemId, onItemSelect, setCustomItems, onOverviewClick])

    return (
        <div className="flex h-[calc(100vh-180px)] border rounded-md overflow-hidden bg-white shadow-sm">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
                {/* Module Header Bar */}
                <div className="h-10 border-b bg-white flex items-center px-4 justify-between shrink-0">
                    <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                        {title}
                    </h2>
                    <div className="flex gap-2">
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-auto p-4">
                    {children}
                </div>
            </div>
        </div>
    )
}
