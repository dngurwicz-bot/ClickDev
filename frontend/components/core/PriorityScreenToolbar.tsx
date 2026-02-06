'use client'

import React from 'react'
import {
    X,
    HelpCircle,
    Settings,
    Table,
    Columns3,
    Star,
    BookmarkPlus,
    Printer,
    Clipboard,
    BarChart3,
    Bot,
    ChevronDown,
    Filter,
    Plus,
    RotateCcw,
    MessageSquare,
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
    onAddNew,
    onRefresh,
    showViewToggle = true,
}: PriorityScreenToolbarProps) {
    const { viewMode, toggleViewMode } = useViewMode()

    return (
        <div className="flex flex-col bg-white border-b border-[#BDC3C7] shrink-0" dir="rtl">
            {/* Top row: title + action icons */}
            <div className="flex items-center justify-between h-9 px-2 border-b border-[#E8EAEB]">
                {/* Right side: close, help, settings */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#E8EAEB] rounded transition-colors"
                        title="סגור"
                    >
                        <X className="w-4 h-4 text-[#7F8C8D]" />
                    </button>
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="עזרה">
                        <HelpCircle className="w-4 h-4 text-[#7F8C8D]" />
                    </button>
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="הגדרות">
                        <Settings className="w-4 h-4 text-[#7F8C8D]" />
                    </button>

                    {/* View Toggle Buttons */}
                    {showViewToggle && (
                        <>
                            <div className="w-px h-4 bg-[#D5DBDB] mx-1" />
                            <button
                                onClick={() => toggleViewMode()}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    viewMode === 'table'
                                        ? "bg-[#2980B9] text-white"
                                        : "hover:bg-[#E8EAEB] text-[#7F8C8D]"
                                )}
                                title="תצוגת טבלה (F2)"
                            >
                                <Table className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => toggleViewMode()}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    viewMode === 'form'
                                        ? "bg-[#2980B9] text-white"
                                        : "hover:bg-[#E8EAEB] text-[#7F8C8D]"
                                )}
                                title="תצוגת טופס (F2)"
                            >
                                <Columns3 className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    <div className="w-px h-4 bg-[#D5DBDB] mx-1" />

                    {/* Bookmarks, print, etc. */}
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="מועדפים">
                        <Star className="w-4 h-4 text-[#7F8C8D]" />
                    </button>
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="חיפושים שמורים">
                        <BookmarkPlus className="w-4 h-4 text-[#7F8C8D]" />
                    </button>

                    <div className="w-px h-4 bg-[#D5DBDB] mx-1" />

                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="הדפסת מדבקות">
                        <Printer className="w-4 h-4 text-[#7F8C8D]" />
                    </button>
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="העתק">
                        <Clipboard className="w-4 h-4 text-[#7F8C8D]" />
                    </button>
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="דוחות">
                        <BarChart3 className="w-4 h-4 text-[#7F8C8D]" />
                    </button>

                    <div className="w-px h-4 bg-[#D5DBDB] mx-1" />

                    {/* Automations */}
                    <button className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#E8EAEB] rounded transition-colors text-[#7F8C8D]">
                        <Bot className="w-4 h-4" />
                        <span className="text-[11px]">אוטומציות</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    <div className="w-px h-4 bg-[#D5DBDB] mx-1" />

                    {/* Saved searches */}
                    <button className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#E8EAEB] rounded transition-colors text-[#7F8C8D]">
                        <Filter className="w-4 h-4" />
                        <span className="text-[11px]">חיפושים שמורים</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>

                {/* Left side: Title */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#2C3E50]">{title}</span>
                </div>
            </div>

            {/* Second row: Tabs + New button */}
            <div className="flex items-center justify-between h-9 px-2">
                {/* Right side: Quick action tabs */}
                <div className="flex items-center gap-1">
                    {/* New button */}
                    <button
                        onClick={onAddNew}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#2980B9] text-white rounded text-xs font-bold hover:bg-[#2471A3] transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>חדש</span>
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={onRefresh}
                        className="p-1 hover:bg-[#E8EAEB] rounded transition-colors"
                        title="רענן"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-[#7F8C8D]" />
                    </button>

                    <div className="w-px h-4 bg-[#D5DBDB] mx-1" />

                    {/* Custom tabs */}
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors",
                                activeTab === tab.id
                                    ? "bg-[#2980B9] text-white"
                                    : "text-[#2C3E50] hover:bg-[#E8EAEB]"
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Left side: Chat/AI */}
                <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-[#E8EAEB] rounded transition-colors" title="צ'אט">
                        <MessageSquare className="w-4 h-4 text-[#7F8C8D]" />
                    </button>
                </div>
            </div>
        </div>
    )
}
