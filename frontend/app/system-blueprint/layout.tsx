import AppMainLayout from '@/components/layout/AppMainLayout'

export default function SystemBlueprintLayout({
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
