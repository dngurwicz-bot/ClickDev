import PriorityMainLayout from '@/components/layout/PriorityMainLayout'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <PriorityMainLayout>
            {children}
        </PriorityMainLayout>
    )
}
