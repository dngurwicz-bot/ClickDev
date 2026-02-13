import AppMainLayout from '@/components/layout/AppMainLayout'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AppMainLayout>
            {children}
        </AppMainLayout>
    )
}
