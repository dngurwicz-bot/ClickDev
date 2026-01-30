'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Package,
  ArrowRight,
  Bell
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'

const menuItems = [
  { href: '/admin/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/admin/organizations', label: 'ארגונים', icon: Building2 },
  { href: '/admin/subscription-tiers', label: 'סוגי מנויים', icon: Package },
  { href: '/admin/announcements', label: 'הודעות', icon: Bell },
  { href: '/admin/analytics', label: 'אנליטיקס', icon: BarChart3 },
  { href: '/admin/settings', label: 'הגדרות', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userData, setUserData] = useState<{
    email: string
    fullName: string
    avatarUrl: string | null
  }>({
    email: '',
    fullName: '',
    avatarUrl: null
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData({
          email: user.email || '',
          fullName: user.user_metadata?.full_name || 'Admin User',
          avatarUrl: user.user_metadata?.avatar_url || null
        })
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 bg-secondary h-screen fixed right-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Logo size="md" variant="light" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="mb-4 flex items-center gap-3 px-2">
          {userData.avatarUrl ? (
            <img
              src={userData.avatarUrl}
              alt={userData.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600 text-gray-300">
              <User className="w-6 h-6" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">{userData.fullName}</span>
            <span className="text-primary text-xs font-medium">Super Admin</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="w-full flex items-center gap-3 px-4 py-2 mb-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>חזרה למערכת</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>התנתק</span>
        </button>
      </div>
    </div>
  )
}
