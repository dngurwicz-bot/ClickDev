'use client'

import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-bg-main">
            <Sidebar />
            <main className="flex-1 overflow-y-auto mr-64">
                <TopBar />
                {children}
            </main>
        </div>
    )
}
