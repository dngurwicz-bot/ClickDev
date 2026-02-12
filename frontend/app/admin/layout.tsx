'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isSuperAdmin, getCurrentUser } from '@/lib/auth'

import TopNavigation from '@/components/dashboard/TopNavigation'
import { StatusBarProvider } from '@/context/StatusBarContext'
import { PriorityStatusBar } from '@/components/layout/PriorityStatusBar'

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
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }

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
    <StatusBarProvider>
      <div className="flex flex-col h-screen bg-bg-main" dir="rtl">
        <div className="w-full z-20 shadow-sm relative">
          <TopNavigation />
        </div>

        <main className="flex-1 overflow-y-auto p-6 pb-14 transition-all duration-300">
          {children}
        </main>

        <PriorityStatusBar />
      </div>
    </StatusBarProvider>
  )
}
