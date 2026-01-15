"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Pause, Play, AlertTriangle, Loader2 } from 'lucide-react'

interface OrganizationActionsProps {
  organizationId: string
  organizationName: string
}

export function OrganizationActions({ organizationId, organizationName }: OrganizationActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה במחיקת הארגון')
      }

      router.push('/admin/organizations')
      router.refresh()
    } catch (error: any) {
      alert('שגיאה במחיקת הארגון: ' + error.message)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setIsOpen(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בעדכון הסטטוס')
      }

      router.refresh()
    } catch (error: any) {
      alert('שגיאה בעדכון הסטטוס: ' + error.message)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-text-primary hover:bg-gray-50"
      >
        <MoreHorizontal className="h-4 w-4" />
        פעולות
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute left-0 z-20 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                onClick={() => handleStatusChange('suspended')}
                disabled={loading}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
              >
                <Pause className="h-4 w-4" />
                השהה ארגון
              </button>
              
              <button
                onClick={() => handleStatusChange('active')}
                disabled={loading}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
              >
                <Play className="h-4 w-4" />
                הפעל ארגון
              </button>
              
              <div className="my-1 border-t border-gray-100" />
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                מחק ארגון
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-red-50 p-3 text-red-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">
                פעולה זו תמחק את הארגון וכל הנתונים הקשורים אליו לצמיתות!
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              אישור מחיקת ארגון
            </h3>
            <p className="text-text-secondary mb-6">
              האם אתה בטוח שברצונך למחוק את הארגון <strong>"{organizationName}"</strong>?
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
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    מחק לצמיתות
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
