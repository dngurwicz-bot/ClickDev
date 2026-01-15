"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function MaintenanceBanner() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [message, setMessage] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function checkMaintenanceMode() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        // Check if user is super admin - they shouldn't see maintenance banner
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single()

          if (profile?.is_super_admin) {
            return // Super admin doesn't see maintenance banner
          }

          // Check organization-specific maintenance mode
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)

          if (userRoles && userRoles.length > 0) {
            const orgId = userRoles[0].organization_id
            if (orgId) {
              const { data: org } = await supabase
                .from('organizations')
                .select('maintenance_mode, maintenance_message')
                .eq('id', orgId)
                .single()

              if (org?.maintenance_mode && org.maintenance_message) {
                setMaintenanceMode(true)
                setMessage(org.maintenance_message)
                return
              }
            }
          }
        }

        // Check global maintenance mode
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const settings = await response.json()
          if (settings.maintenance_mode?.enabled) {
            setMaintenanceMode(true)
            // Use Hebrew message by default, or English if needed
            setMessage(settings.maintenance_mode.message || settings.maintenance_mode.message_en || 'המערכת בתחזוקה')
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
      }
    }

    checkMaintenanceMode()
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!maintenanceMode || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-600 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
