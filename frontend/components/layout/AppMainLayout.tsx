'use client'

import React from 'react'
import { AppHeader } from './AppHeader'
import { FocusProvider } from '@/context/FocusContext'
import { ViewModeProvider } from '@/context/ViewModeContext'
import { StatusBarProvider } from '@/context/StatusBarContext'
import { AppBottomDock } from './AppBottomDock'

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen w-full bg-bg-main overflow-hidden text-text-primary font-sans" dir="rtl">
            <AppHeader />

            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto bg-[var(--ui-bg)] relative mb-6">
                    <div className="min-h-full w-full">
                        {children}
                    </div>
                </main>
            </div>

            <AppBottomDock />
        </div>
    )
}

export default function AppMainLayout({ children }: { children: React.ReactNode }) {
    return (
        <FocusProvider>
            <ViewModeProvider>
                <StatusBarProvider>
                    <AppLayoutContent>
                        {children}
                    </AppLayoutContent>
                </StatusBarProvider>
            </ViewModeProvider>
        </FocusProvider>
    )
}

