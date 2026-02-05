'use client'

import React from 'react'
import { PriorityHeader } from './PriorityHeader'
import { FocusProvider, useFocusContext } from '@/context/FocusContext'

function PriorityLayoutContent({ children }: { children: React.ReactNode }) {
    const { focusedLabel } = useFocusContext()

    return (
        <div className="flex flex-col h-screen w-full bg-bg-main overflow-hidden text-text-primary font-sans" dir="rtl">
            {/* Double Header */}
            <PriorityHeader />

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto bg-[#ECF0F1] relative mb-6">
                    <div className="min-h-full w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer Status Bar */}
            <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#2C3E50] text-white text-xs flex items-center px-4 font-bold select-none z-50 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="opacity-70">שדה:</span>
                    <span className="text-yellow-400">{focusedLabel || ''}</span>
                </div>
            </div>
        </div>
    )
}

export default function PriorityMainLayout({ children }: { children: React.ReactNode }) {
    return (
        <FocusProvider>
            <PriorityLayoutContent>
                {children}
            </PriorityLayoutContent>
        </FocusProvider>
    )
}

