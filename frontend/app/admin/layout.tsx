import { Sidebar } from '@/components/admin/Sidebar'
import { NavigationProgress } from '@/components/admin/NavigationProgress'
import { requireSuperAdmin } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()

  return (
    <div className="flex h-screen bg-bg-main" dir="rtl">
      <NavigationProgress />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
