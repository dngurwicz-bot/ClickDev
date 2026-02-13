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
        <div className="flex flex-col click-ui-toolbar shrink-0" dir="rtl">
            <div className="flex items-center justify-between h-10 px-3 border-b border-[var(--ui-border)] bg-gradient-to-l from-[#F7FBFE] to-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExit}
                        className="p-1.5 hover:bg-[var(--ui-accent-soft)] rounded transition-colors"
                        title="סגור"
                    >
                        <X className="w-4 h-4 text-[var(--ui-text-soft)]" />
                    </button>
                    <div className="h-5 w-px bg-[var(--ui-border)]" />
                    <span className="text-sm font-semibold text-[var(--ui-text)]">{title}</span>
                    <span className="text-[11px] text-[var(--ui-text-soft)] bg-[var(--ui-surface-soft)] px-2 py-0.5 rounded-full border border-[var(--ui-border)]">CLICK</span>
                </div>

                <div className="flex items-center gap-1">
                    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--ui-text-soft)] bg-[var(--ui-surface-soft)] border border-[var(--ui-border)] rounded">
                        <Command className="w-3.5 h-3.5" />
                        <span>F2 החלפת תצוגה</span>
                    </div>
                    {showViewToggle && (
                        <button
                            onClick={() => toggleViewMode()}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors",
                                viewMode === 'table'
                                    ? "border-[var(--ui-border-strong)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]"
                                    : "border-[var(--ui-border)] bg-[var(--ui-surface-soft)] text-[var(--ui-text-soft)]"
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
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ui-accent)] text-white rounded-md text-xs font-semibold hover:opacity-90 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>עובד חדש</span>
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 hover:bg-[var(--ui-accent-soft)] rounded transition-colors"
                        title="רענן"
                    >
                        <RotateCcw className="w-4 h-4 text-[var(--ui-text-soft)]" />
                    </button>
                    <div className="h-5 w-px bg-[var(--ui-border)] mx-1" />
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                activeTab === tab.id
                                    ? "bg-[var(--ui-text)] text-white"
                                    : "text-[var(--ui-text)] hover:bg-[var(--ui-accent-soft)]"
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--ui-text-soft)]">
                    <Search className="w-3.5 h-3.5" />
                    <span>חיפוש מהיר לפי מס עובד / ת.ז מתוך שורת הסינון בטבלה</span>
                </div>
            </div>
        </div>
    )
}
