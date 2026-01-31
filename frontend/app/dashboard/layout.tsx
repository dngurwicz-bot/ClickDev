'use client'

import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { useSidebar } from '@/lib/contexts/SidebarContext'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { sidebarHidden } = useSidebar()

    return (
        <div className="flex h-screen bg-bg-main">
            {!sidebarHidden && <Sidebar />}
            <main className={`flex-1 overflow-y-auto ${sidebarHidden ? '' : 'mr-64'}`}>
                <TopBar />
                {children}
            </main>
        </div>
    )
}
