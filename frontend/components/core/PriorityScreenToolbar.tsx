'use client'

import React, { useEffect } from 'react'
import {
    X,
    Search,
    Table,
    Columns3,
    Plus,
    RotateCcw,
    Command,
} from 'lucide-react'
import { useViewMode } from '@/context/ViewModeContext'
import { cn } from '@/lib/utils'

interface ToolbarTab {
    id: string
    label: string
    icon?: React.ReactNode
}

interface PriorityScreenToolbarProps {
    title: string
    tabs?: ToolbarTab[]
    activeTab?: string
    onTabChange?: (tabId: string) => void
    onClose?: () => void
    onRequestExit?: () => void
    onAddNew?: () => void
    onRefresh?: () => void
    showViewToggle?: boolean
}

export function PriorityScreenToolbar({
    title,
    tabs = [],
    activeTab,
    onTabChange,
    onClose,
    onRequestExit,
    onAddNew,
    onRefresh,
    showViewToggle = true,
}: PriorityScreenToolbarProps) {
    const { viewMode, toggleViewMode } = useViewMode()
    const handleExit = onRequestExit ?? onClose

    // ESC key requests screen exit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Don't intercept if a modal or dialog is open
                if (document.querySelector('.fixed.inset-0.z-50') ||
                    document.querySelector('.fixed.inset-0.z-\\[60\\]')) return

                e.preventDefault()
                handleExit?.()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleExit])

    return (
        <div className="flex flex-col bg-white border-b border-slate-200 shrink-0" dir="rtl">
            <div className="flex items-center justify-between h-10 px-3 border-b border-slate-100 bg-gradient-to-l from-[#F8FAFC] to-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExit}
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        title="סגור"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                    <div className="h-5 w-px bg-slate-200" />
                    <span className="text-sm font-semibold text-slate-800">{title}</span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">CLICK Flow</span>
                </div>

                <div className="flex items-center gap-1">
                    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded">
                        <Command className="w-3.5 h-3.5" />
                        <span>F2 החלפת תצוגה</span>
                    </div>
                    {showViewToggle && (
                        <button
                            onClick={() => toggleViewMode()}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors",
                                viewMode === 'table'
                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            )}
                            title="החלפת תצוגה (F2)"
                        >
                            {viewMode === 'table' ? <Table className="w-3.5 h-3.5" /> : <Columns3 className="w-3.5 h-3.5" />}
                            <span>{viewMode === 'table' ? 'טבלה' : 'טופס'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between h-11 px-3 bg-white">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onAddNew}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>עובד חדש</span>
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        title="רענן"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                    </button>
                    <div className="h-5 w-px bg-slate-200 mx-1" />
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                activeTab === tab.id
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-700 hover:bg-slate-100"
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600">
                    <Search className="w-3.5 h-3.5" />
                    <span>חיפוש מהיר לפי מס עובד / ת.ז מתוך שורת הסינון בטבלה</span>
                </div>
            </div>
        </div>
    )
}
