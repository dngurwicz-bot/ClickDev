'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    User,
    Users,
    Settings,
    LogOut,
    Building2,
    FileText,
    ChevronDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

const menuItems = [
    { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { href: '/dashboard/employees', label: 'עובדים', icon: Users },
    { href: '/dashboard/documents', label: 'מסמכים', icon: FileText },
    { href: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userName, setUserName] = useState<string>('')
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserAvatar(user.user_metadata?.avatar_url || null)

                // Get name from metadata
                const firstName = user.user_metadata?.first_name || ''
                const lastName = user.user_metadata?.last_name || ''
                if (firstName && lastName) {
                    setUserName(`${firstName} ${lastName}`)
                } else {
                    setUserName(user.email || 'משתמש')
                }
            }
        }
        getUser()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="w-64 bg-white border-l h-screen fixed right-0 top-0 flex flex-col shadow-sm">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Logo size="md" />
            </div>

            {/* Organization Info */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                {isLoading ? (
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                ) : organizations.length > 1 ? (
                    <div className="relative">
                        <select
                            value={currentOrg?.id || ''}
                            onChange={(e) => {
                                const org = organizations.find(o => o.id === e.target.value)
                                if (org) setCurrentOrg(org)
                            }}
                            className="w-full appearance-none bg-white border border-gray-200 text-text-primary text-sm font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            {organizations.map(org => (
                                <option key={org.id} value={org.id} className="text-gray-900">
                                    {org.name}
                                </option>
                            ))}
                        </select>
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-text-primary font-semibold">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="truncate">{currentOrg?.name || 'טוען...'}</span>
                    </div>
                )}
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
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User info and logout */}
            <div className="p-4 border-t border-gray-100">
                <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer group"
                >
                    <div className="relative">
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-primary transition-colors"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-500 group-hover:border-primary group-hover:text-primary transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate group-hover:text-primary transition-colors" title={userName}>{userName}</p>
                        <p className="text-xs text-text-muted">עדכון פרופיל</p>
                    </div>
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>התנתק</span>
                </button>
            </div>
        </div>
    )
}
