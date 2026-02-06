'use client'

import React from 'react'
import { PriorityHeader } from './PriorityHeader'
import { FocusProvider, useFocusContext } from '@/context/FocusContext'
import { ViewModeProvider } from '@/context/ViewModeContext'
import { PriorityStatusBar } from './PriorityStatusBar'

function PriorityLayoutContent({ children }: { children: React.ReactNode }) {
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
            <PriorityStatusBar />
        </div>
    )
}

export default function PriorityMainLayout({ children }: { children: React.ReactNode }) {
    return (
        <FocusProvider>
            <ViewModeProvider>
                <PriorityLayoutContent>
                    {children}
                </PriorityLayoutContent>
            </ViewModeProvider>
        </FocusProvider>
    )
}

