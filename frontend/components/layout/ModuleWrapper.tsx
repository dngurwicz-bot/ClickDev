'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ModuleWrapperProps {
    title: string
    tabs?: { label: string; value: string }[]
    activeTab?: string
    onTabChange?: (value: string) => void
    actions?: React.ReactNode
    children: React.ReactNode
}

export function ModuleWrapper({ title, tabs, activeTab, onTabChange, actions, children }: ModuleWrapperProps) {
    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-secondary">{title}</h1>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {/* Internal Tabs */}
            {tabs && tabs.length > 0 && (
                <div className="px-6 pt-2 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => onTabChange?.(tab.value)}
                                className={cn(
                                    "pb-3 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === tab.value
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Content - Dense Form Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                {children}
            </div>
        </div>
    )
}
