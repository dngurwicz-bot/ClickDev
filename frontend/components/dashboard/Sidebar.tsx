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
    ChevronDown,
    Network,
    Briefcase,
    GraduationCap,
    GitGraph
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { useSidebar, useSidebarActions } from '@/lib/contexts/SidebarContext'

type MenuItem = {
    label: string
    icon: any
    href?: string
    children?: { href: string; label: string }[]
}

const defaultMenuItems: MenuItem[] = [
    { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { href: '/dashboard/documents', label: 'מסמכים', icon: FileText },
    { href: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

const coreMenuItems: MenuItem[] = [
    { href: '/dashboard/core', label: 'ראשי', icon: LayoutDashboard },
    {
        label: 'מבנה ארגוני',
        icon: Network,
        children: [
            { href: '/dashboard/core/wizard', label: 'אשף הקמה מבנה ארגוני' },
            { href: '/dashboard/core/structure-def', label: 'הגדרת מבנה ארגוני' },
            { href: '/dashboard/core/divisions', label: 'טבלת חטיבות' },
            { href: '/dashboard/core/wings', label: 'טבלת אגפים' },
            { href: '/dashboard/core/departments', label: 'טבלת מחלקות' },
            { href: '/dashboard/core/teams', label: 'טבלת צוותים' },
            { href: '/dashboard/core/positions', label: 'תקנים בארגון' },
            { href: '/dashboard/core/titles', label: 'טבלת תפקידים' },
            { href: '/dashboard/core/grades', label: 'דירוגי תפקיד' },
        ]
    },
    { href: '/dashboard/core/catalog', label: 'קטלוג משרות', icon: GraduationCap },
]

function CollapsibleMenuItem({ item, pathname }: { item: MenuItem, pathname: string | null }) {
    const isChildActive = item.children?.some(child => pathname === child.href)
    const [isOpen, setIsOpen] = useState(isChildActive)

    useEffect(() => {
        if (isChildActive) setIsOpen(true)
    }, [isChildActive])

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isChildActive
                    ? 'text-primary font-medium'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mr-8 space-y-1 border-r border-gray-100 pr-2">
                    {item.children?.map(child => {
                        const isActive = pathname === child.href
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                                    }`}
                            >
                                {child.label}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userName, setUserName] = useState<string>('')
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization()
    const { customItems } = useSidebar()
    const { setCustomItems } = useSidebarActions()

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

    const [menuItems, setMenuItems] = useState<MenuItem[]>([])

    useEffect(() => {
        const isCore = pathname?.startsWith('/dashboard/core')
        const items = isCore ? coreMenuItems : defaultMenuItems

        if (isCore && currentOrg) {
            // Filter core items based on hierarchy
            const levels = currentOrg.hierarchy_levels || []

            const filteredItems = items.map(item => {
                if (item.label === 'מבנה ארגוני') {
                    const children = item.children?.filter(child => {
                        // Always show setup pages
                        if (['אשף הקמה מבנה ארגוני', 'הגדרת מבנה ארגוני'].includes(child.label)) return true

                        // Feature flags
                        if (child.label === 'דירוגי תפקיד' && currentOrg.use_job_grades) return true
                        if (child.label === 'טבלת תפקידים' && currentOrg.use_job_titles) return true

                        // Show tables based on selected levels
                        if (child.label === 'טבלת חטיבות' && levels.includes('Division')) return true
                        if (child.label === 'טבלת אגפים' && levels.includes('Wing')) return true
                        if (child.label === 'טבלת מחלקות' && levels.includes('Department')) return true
                        if (child.label === 'טבלת צוותים' && levels.includes('Team')) return true
                        if (child.label === 'תקנים בארגון' && levels.includes('Role')) return true

                        return false
                    })
                    return { ...item, children }
                }
                return item
            })
            setMenuItems(filteredItems)
        } else {
            setMenuItems(items)
        }
    }, [pathname, currentOrg])

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
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {customItems && customItems.length > 0 ? (
                    <div className="space-y-4">
                        <div className="px-4 py-2 bg-slate-100 rounded-lg">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">ניווט מהיר</h3>
                        </div>
                        <div className="space-y-1">
                            {customItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={item.onClick}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors text-right"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary shrink-0" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    menuItems.map((item, index) => {
                        const Icon = item.icon
                        const hasChildren = 'children' in item && item.children && item.children.length > 0
                        const isChildActive = hasChildren && item.children?.some(child => pathname === child.href)
                        const isActive = pathname === item.href || isChildActive

                        if (hasChildren) {
                            return (
                                <CollapsibleMenuItem key={index} item={item} pathname={pathname} />
                            )
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })
                )}
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
