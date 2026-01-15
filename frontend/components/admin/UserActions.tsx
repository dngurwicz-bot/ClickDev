"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MoreHorizontal, Trash2, Edit, Key, Shield, Loader2, AlertTriangle } from 'lucide-react'

interface UserActionsProps {
  userId: string
  roleId: string
  userEmail?: string
  isSuperAdmin: boolean
}

export function UserActions({ userId, roleId, userEmail, isSuperAdmin }: UserActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current logged in user ID
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  const isCurrentUser = currentUserId === userId

  const handleResetPassword = async () => {
    if (!userEmail) return
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      alert(`מייל לאיפוס סיסמה נשלח ל-${userEmail}`)
    } catch (error) {
      alert('שגיאה בשליחת מייל איפוס סיסמה')
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      // Call API route to delete user (uses service role)
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה במחיקת המשתמש')
      }

      router.refresh()
    } catch (error: any) {
      alert('שגיאה במחיקת המשתמש: ' + error.message)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 text-text-secondary hover:bg-gray-100 hover:text-text-primary"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 z-20 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {userEmail && (
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
                >
                  <Key className="h-4 w-4" />
                  שלח איפוס סיסמה
                </button>
              )}
              
              <button
                onClick={() => router.push(`/admin/users/${userId}/edit`)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                ערוך פרטים
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-100" />

              {/* Delete option */}
              {isCurrentUser ? (
                <div className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                  <Shield className="h-4 w-4" />
                  לא ניתן למחוק את עצמך
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`
                    flex w-full items-center gap-2 px-4 py-2 text-sm 
                    ${isSuperAdmin 
                      ? 'text-purple-600 hover:bg-purple-50' 
                      : 'text-red-600 hover:bg-red-50'
                    }
                  `}
                >
                  <Trash2 className="h-4 w-4" />
                  {isSuperAdmin ? 'מחק Super Admin' : 'מחק משתמש'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            {isSuperAdmin && (
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 p-3 text-amber-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">
                  אתה עומד למחוק משתמש Super Admin. פעולה זו תסיר ממנו גישה מלאה למערכת.
                </span>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {isSuperAdmin ? 'אישור מחיקת Super Admin' : 'אישור מחיקת משתמש'}
            </h3>
            <p className="text-text-secondary mb-6">
              האם אתה בטוח שברצונך למחוק את המשתמש <strong>{userEmail}</strong>?
              <br />
              <span className="text-red-600 text-sm">פעולה זו אינה ניתנת לביטול.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-text-primary hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className={`
                  flex items-center gap-2 rounded-lg px-4 py-2 text-white disabled:opacity-50
                  ${isSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    מחק
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
