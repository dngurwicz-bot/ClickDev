'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen w-full bg-bg-main overflow-hidden text-text-primary font-sans" dir="rtl">
            {/* Header - Full Width at Top */}
            <Header />

            {/* Main Content Area with Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar - Fixed Right (in RTL) */}
                <Sidebar />

                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-bg-main relative">
                    {/* Inner Content Container */}
                    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
