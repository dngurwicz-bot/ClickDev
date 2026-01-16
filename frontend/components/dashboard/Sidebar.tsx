'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Building2,
    FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'

const menuItems = [
    { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { href: '/dashboard/employees', label: 'עובדים', icon: Users },
    { href: '/dashboard/documents', label: 'מסמכים', icon: FileText },
    { href: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string>('')
    const [orgName, setOrgName] = useState<string>('')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || '')

                // Fetch organization name
                const { data: userRoles } = await supabase
                    .from('user_roles')
                    .select('organizations(name)')
                    .eq('user_id', user.id)

                // Get first organization name if exists
                // We handle multiple roles gracefully
                if (userRoles && userRoles.length > 0) {
                    const firstOrg = userRoles[0].organizations
                    // @ts-ignore
                    if (firstOrg) setOrgName(firstOrg.name)
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
            {orgName && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-text-primary font-semibold">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="truncate">{orgName}</span>
                    </div>
                </div>
            )}

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
                <div className="mb-3">
                    <p className="text-text-primary text-sm font-medium truncate">{userEmail}</p>
                    <span className="text-text-secondary text-xs">מנהל ארגון</span>
                </div>
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
