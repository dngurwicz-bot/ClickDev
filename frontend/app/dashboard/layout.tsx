'use client'

import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-bg-main">
            <Sidebar />
            <main className="flex-1 overflow-y-auto mr-64">
                {children}
            </main>
        </div>
    )
}
