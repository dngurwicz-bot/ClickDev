'use client'

import React from 'react'
import { Bell, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
    return (
        <header className="h-12 bg-secondary text-white flex items-center justify-between px-4 shadow-md z-50 relative">
            {/* Right Side: Logo */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-white shadow-sm">
                    C
                </div>
                <span className="font-bold text-lg tracking-wide hidden md:block">CLICK. DNG HUB</span>
            </div>

            {/* Center: Global Search */}
            <div className="flex-1 max-w-xl mx-4">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="חיפוש גלובלי..."
                        className="w-full bg-secondary-light/50 text-white placeholder-gray-400 text-sm rounded-md py-1.5 pr-9 pl-4 focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Left Side: Actions */}
            <div className="flex items-center gap-3">
                <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-300" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-secondary"></span>
                </button>

                <div className="h-6 w-px bg-white/20 mx-1"></div>

                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-1.5 rounded-md transition-colors">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                        DG
                    </div>
                </div>
            </div>
        </header>
    )
}
