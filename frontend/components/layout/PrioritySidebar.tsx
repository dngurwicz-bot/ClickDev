'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronLeft, Clock, Star, History, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Quick actions or recent items to mimic "Last Used"
const RECENT_ITEMS = [
    { label: 'כרטיס ליבה - עובד', icon: FileText, href: '/dashboard/core/employees/1' },
    { label: 'דוח שעות חודשי', icon: History, href: '#' },
    { label: 'ניהול משימות', icon: Star, href: '#' },
]

const FAVORITES = [
    { label: 'יצירת עובד חדש', href: '/dashboard/core/employees/new' },
    { label: 'System Blueprint', href: '/system-blueprint' },
    { label: 'דוחות ניהוליים', href: '#' },
]

export function PrioritySidebar() {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        recent: true,
        favorites: true
    })

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    return (
        <div className="w-64 bg-secondary text-white flex flex-col h-full border-l border-white/10 shrink-0">
            {/* Accordion 1: Recently Used */}
            <div className="border-b border-white/10">
                <button
                    onClick={() => toggleSection('recent')}
                    className="w-full flex items-center justify-between p-3 bg-secondary-light/30 hover:bg-secondary-light/50 transition-colors text-xs font-bold tracking-wide uppercase text-gray-400"
                >
                    <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        בשימוש לאחרונה
                    </span>
                    {openSections.recent ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>

                {openSections.recent && (
                    <div className="bg-secondary-light/10">
                        {RECENT_ITEMS.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className="block px-4 py-2 text-sm text-gray-300 hover:text-primary hover:bg-white/5 truncate transition-colors border-r-2 border-transparent hover:border-primary"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Accordion 2: Favorites */}
            <div className="border-b border-white/10">
                <button
                    onClick={() => toggleSection('favorites')}
                    className="w-full flex items-center justify-between p-3 bg-secondary-light/30 hover:bg-secondary-light/50 transition-colors text-xs font-bold tracking-wide uppercase text-gray-400"
                >
                    <span className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" />
                        מועדפים
                    </span>
                    {openSections.favorites ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>

                {openSections.favorites && (
                    <div className="bg-secondary-light/10">
                        {FAVORITES.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className="block px-4 py-2 text-sm text-gray-300 hover:text-primary hover:bg-white/5 truncate transition-colors border-r-2 border-transparent hover:border-primary"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Area / Extra Tools */}
            <div className="mt-auto p-4 border-t border-white/10">
                <div className="bg-white/5 rounded p-3 text-center text-xs text-gray-500">
                    CLICK Ver 2.0
                </div>
            </div>
        </div>
    )
}
