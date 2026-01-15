"use client"

import { useState } from 'react'
import { Mail, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface ResendPasswordEmailProps {
  userEmail: string
  organizationId?: string
  organizationName?: string
}

export function ResendPasswordEmail({ 
  userEmail, 
  organizationId,
  organizationName 
}: ResendPasswordEmailProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleResend = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Use API route that has service role access
      const response = await fetch('/api/admin/users/resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          organizationId,
          organizationName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת מייל')
      }

      if (data.emailSent) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 5000)
      } else {
        throw new Error('המייל לא נשלח')
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בשליחת מייל')
      setTimeout(() => setError(null), 10000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleResend}
        disabled={loading || success}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            שולח...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            נשלח!
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            שלח מייל מחדש
          </>
        )}
      </button>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            מייל לאיפוס סיסמה נשלח בהצלחה ל-{userEmail}
          </div>
        </div>
      )}
    </div>
  )
}
