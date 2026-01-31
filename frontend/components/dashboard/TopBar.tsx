'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, ShieldCheck, HelpCircle, Mail, User, LogOut, Building2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { isSuperAdmin } from '@/lib/auth'
import { useSidebar } from '@/lib/contexts/SidebarContext'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'

export default function TopBar() {
    const pathname = usePathname()
    const router = useRouter()
    const [showAdminLink, setShowAdminLink] = useState(false)
    const { sidebarHidden } = useSidebar()
    const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization()
    const [userName, setUserName] = useState<string>('')
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const isCoreModule = pathname?.startsWith('/dashboard/core')

    useEffect(() => {
        const checkRole = async () => {
            try {
                const isSA = await isSuperAdmin()
                console.log('TopBar checkRole result:', isSA)
                setShowAdminLink(isSA)
            } catch (err) {
                console.error('TopBar checkRole error:', err)
            }
        }
        checkRole()
    }, [])

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserAvatar(user.user_metadata?.avatar_url || null)
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

    // Employee File View - Full width with user in header
    if (sidebarHidden) {
        return (
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex justify-between items-center sticky top-0 z-10 w-full shadow-sm">
                {/* Right side - Logo and org selector */}
                <div className="flex items-center gap-4">
                    <Logo size="sm" />

                    {/* Organization selector */}
                    <div className="border-r border-gray-200 pr-4 mr-2 flex items-center gap-4">
                        {isLoading ? (
                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                        ) : organizations.length > 1 ? (
                            <div className="relative">
                                <select
                                    value={currentOrg?.id || ''}
                                    onChange={(e) => {
                                        const org = organizations.find(o => o.id === e.target.value)
                                        if (org) setCurrentOrg(org)
                                    }}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-text-primary text-sm font-medium rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                                >
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-text-primary font-medium text-sm">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span>{currentOrg?.name || 'טוען...'}</span>
                            </div>
                        )}

                        <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                        <Link
                            href="/dashboard/core"
                            className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors text-sm font-black"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span>חזרה לדשבורד Click Core</span>
                        </Link>
                    </div>
                </div>

                {/* Left side - User info */}
                <div className="flex items-center gap-4">
                    {showAdminLink && (
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>אדמין</span>
                        </Link>
                    )}

                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-500">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                        <span className="text-sm font-medium text-text-primary">{userName}</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>התנתק</span>
                    </button>
                </div>
            </div>
        )
    }

    if (isCoreModule) {
        return (
            <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10 w-full mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
                    >
                        <ArrowRight className="w-4 h-4" />
                        <span>חזרה לדשבורד</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Click Core</h1>
                </div>
            </div>
        )
    }

    // Always show top bar, simplified content for non-admins could go here
    return (
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10 w-full mb-6">
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium">
                    <HelpCircle className="w-4 h-4" />
                    <span>מרכז עזרה</span>
                </button>
                <a href="mailto:support@click-hr.com" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    <span>צור קשר</span>
                </a>
            </div>

            <div className="flex items-center gap-4">
                {showAdminLink && (
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>תפריט סופר אדמין</span>
                    </Link>
                )}
            </div>
        </div>
    )
}
