'use client'

import React from 'react'
import {
    Search,
    Bell,
    HelpCircle,
    Menu,
    ChevronDown
} from 'lucide-react'
import { useSidebarActions } from '@/lib/contexts/SidebarContext'

export function Header() {
    const { showSidebar, hideSidebar } = useSidebarActions() // Assuming context has toggle

    return (
        <header className="h-16 bg-surface border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-40 sticky top-0">

            {/* Left: Search & Trigger */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full hidden md:block group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search className="w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="חיפוש גלובלי..."
                        className="w-full h-9 pr-10 pl-4 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm group-hover:bg-white"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white" />
                </button>
                <button className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-colors">
                    <HelpCircle className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-gray-200 mx-2" />

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary hidden md:block">Click Tech Ltd.</span>
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                        CL
                    </div>
                </div>
            </div>
        </header>
    )
}
