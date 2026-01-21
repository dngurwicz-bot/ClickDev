'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import { isSuperAdmin } from '@/lib/auth'

// Force HMR update
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isSA = await isSuperAdmin()
        if (!isSA) {
          router.push('/unauthorized')
          return
        }
      } catch (error) {
        router.push('/login')
        return
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-bg-main">
      <Sidebar />
      <main className="flex-1 overflow-y-auto mr-64">
        {children}
      </main>
    </div>
  )
}
