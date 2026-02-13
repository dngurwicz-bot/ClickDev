import AppMainLayout from '@/components/layout/AppMainLayout'

export default function AnnouncementsLayout({
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
