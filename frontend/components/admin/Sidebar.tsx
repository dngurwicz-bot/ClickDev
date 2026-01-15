"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  Mail,
  Clock,
  Shield
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

const navigation = [
  { name: 'לוח בקרה', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'ארגונים', href: '/admin/organizations', icon: Building2 },
  { name: 'משתמשים', href: '/admin/users', icon: Users },
  { name: 'אנליטיקה', href: '/admin/analytics', icon: BarChart3 },
  { name: 'הגדרות', href: '/admin/settings', icon: Settings },
]

interface UserProfile {
  id: string
  email: string
  full_name?: string
  is_super_admin: boolean
  last_sign_in_at?: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserProfile() {
      try {
        // Get current user from auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setLoading(false)
          return
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, is_super_admin')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          setLoading(false)
          return
        }

        setUserProfile({
          ...profile,
          last_sign_in_at: user.last_sign_in_at || undefined
        })
      } catch (error) {
        console.error('Error loading user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-secondary text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-secondary/50 px-6">
        <Logo variant="white" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-300 hover:bg-secondary/80 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-secondary/50">
        {/* User Profile */}
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        ) : userProfile ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                {userProfile.is_super_admin ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile.full_name || 'ללא שם'}
                  </p>
                  {userProfile.is_super_admin && (
                    <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-300 truncate">
                    {userProfile.email}
                  </p>
                </div>
              </div>
            </div>
            
            {userProfile.last_sign_in_at && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-secondary/30">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  התחברות אחרונה: {format(new Date(userProfile.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Logout Button */}
        <div className="p-4 pt-0">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-secondary/80 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>התנתק</span>
          </button>
        </div>
      </div>
    </div>
  )
}
