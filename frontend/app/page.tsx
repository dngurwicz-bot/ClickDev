'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const isSA = await isSuperAdmin()
      if (isSA) {
        router.push('/admin/dashboard')
      } else {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
