'use client'
import { useEffect, useState } from 'react'
import { getUserRoles, getCurrentUser } from '@/lib/auth'

export default function UnauthorizedPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    async function loadDebug() {
      try {
        const user = await getCurrentUser()
        const roles = await getUserRoles()
        setDebugInfo({
          userId: user?.id,
          email: user?.email,
          roles: roles,
          timestamp: new Date().toISOString()
        })
      } catch (e) {
        setDebugInfo({ error: String(e) })
      }
    }
    loadDebug()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-4">גישה נדחתה</h1>
        <p className="text-text-secondary mb-8">אין לך הרשאה לגשת לדף זה</p>
        <a href="/login" className="text-primary hover:text-primary-dark font-medium">
          חזור לדף ההתחברות
        </a>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs font-mono max-w-lg w-full overflow-auto border border-gray-300">
        <p className="font-bold mb-2 text-gray-700">Debug Info:</p>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  )
}
