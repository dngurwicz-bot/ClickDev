'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-bg-main overflow-hidden text-text-primary font-sans" dir="rtl">
            {/* Sidebar - Fixed Left (RTL: Right visually if dir=rtl, but flex-row handles order. 
          If dir=rtl, first item is Right. So Sidebar should be first in flex container to appear on right.) 
          Wait, usually sidebar is on the Right for RTL? 
          The user's previous code had dir="rtl".
          Standard Hebrew sites have sidebar on the Right.
          However, `flex-row` with `dir="rtl"` puts the first child on the Right.
      */}
            <Sidebar />

            <div className="flex flex-col flex-1 h-full overflow-hidden relative min-w-0">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {/* Inner Content Container - Max Width for large screens? Optional. */}
                    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
