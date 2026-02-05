'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TabOption {
    id: string
    label: string
}

interface PriorityTabsProps {
    tabs: Tab[]
    activeTab: string
    onTabChange: (id: string) => void
    variant?: 'folder' | 'strip'
}

export function PriorityTabs({ tabs, activeTab, onTabChange, variant = 'strip' }: PriorityTabsProps) {
    if (variant === 'folder') {
        return (
            <div className="flex items-end border-b border-gray-300 px-2 gap-1 mb-4">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "px-4 py-2 text-sm font-bold min-w-[100px] transition-all rounded-t-md border-t border-l border-r relative -mb-[1px]",
                                isActive
                                    ? "bg-white text-primary border-gray-300 border-b-transparent z-10"
                                    : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"
                            )}
                        >
                            {tab.label}
                            {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary rounded-t-md"></div>}
                        </button>
                    )
                })}
            </div>
        )
    }

    // Default 'strip' variant (Bottom Tabs)
    return (
        <div className="bg-gray-200 px-2 pt-2 border-b-2 border-primary flex items-end gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "px-6 py-2 text-sm font-bold min-w-[120px] transition-all relative border-t border-l border-r rounded-t-sm",
                            isActive
                                ? "bg-secondary text-white border-secondary translate-y-[0px] z-10 shadow-sm"
                                : "bg-[#F0F3F4] text-gray-600 border-gray-300 hover:bg-gray-200"
                        )}
                    >
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
