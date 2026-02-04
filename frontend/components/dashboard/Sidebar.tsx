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
    GitGraph,
    ArrowLeft,
    Menu,
    ShieldAlert
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { useSidebar, useSidebarActions } from '@/lib/contexts/SidebarContext'
import { isSuperAdmin } from '@/lib/auth'

type MenuItem = {
    label: string
    icon: any
    href?: string
    children?: { href: string; label: string }[]
}

const defaultMenuItems: MenuItem[] = [
    { href: '/dashboard', label: 'לוח בקרה ראשי', icon: LayoutDashboard },
]

const coreMenuItems: MenuItem[] = [
    { href: '/dashboard/core', label: 'ראשי', icon: LayoutDashboard },
    { href: '/dashboard/core/employees', label: 'כרטיס עובד', icon: Users },
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

const employeeFileMenuItems: MenuItem[] = [
    { href: '/dashboard/core', label: 'חזרה למערכת ראשי', icon: ArrowLeft },
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
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${isChildActive
                    ? 'text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mr-4 space-y-1 border-r border-slate-700 pr-2">
                    {item.children?.map(child => {
                        const isActive = pathname === child.href
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={`block px-3 py-2 text-xs rounded transition-colors ${isActive
                                    ? 'bg-slate-800 text-white font-medium'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
    const { currentOrg } = useOrganization()
    const { customItems } = useSidebar()

    const [isAdmin, setIsAdmin] = useState(false)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])

    useEffect(() => {
        const checkAdmin = async () => {
            const admin = await isSuperAdmin()
            setIsAdmin(admin)
        }
        checkAdmin()
    }, [])

    useEffect(() => {
        const isEmployeeFile = pathname?.startsWith('/dashboard/core/employees')
        const isCore = pathname?.startsWith('/dashboard/core')

        let items = defaultMenuItems
        if (isEmployeeFile) {
            items = employeeFileMenuItems
        } else if (isCore) {
            items = coreMenuItems
        }

        if (isEmployeeFile) {
            setMenuItems(items)
            return
        }

        if (isCore && currentOrg) {
            const levels = currentOrg.hierarchy_levels || []
            const filteredItems = items.map(item => {
                if (item.label === 'מבנה ארגוני') {
                    const children = item.children?.filter(child => {
                        if (['אשף הקמה מבנה ארגוני', 'הגדרת מבנה ארגוני'].includes(child.label)) return true
                        if (child.label === 'דירוגי תפקיד' && currentOrg.use_job_grades) return true
                        if (child.label === 'טבלת תפקידים' && currentOrg.use_job_titles) return true
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
        <div className="w-64 bg-brand-dark text-slate-300 flex flex-col h-full border-l border-slate-700">
            {/* Header / Collapse Trigger */}
            <div className="mt-6 px-4 mb-2">
                <span className="font-semibold text-white">תפריט ראשי</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">

                {/* Admin Link at the top if admin */}
                {isAdmin && (
                    <div className="mb-4 px-2">
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors rounded border border-red-900/30 bg-red-900/10"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            <span>ניהול מערכת (Admin)</span>
                        </Link>
                        <div className="h-px bg-slate-700 my-2 mx-2"></div>
                    </div>
                )}

                {customItems && customItems.length > 0 ? (
                    <div className="space-y-4 px-2">
                        <div className="px-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ניווט מהיר</span>
                        </div>
                        {customItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-right text-sm"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-white shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    menuItems.map((item, index) => {
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
                                className={`flex items-center gap-3 px-4 py-2 text-sm border-r-2 transition-colors ${isActive
                                    ? 'border-brand-teal bg-slate-800/50 text-white'
                                    : 'border-transparent hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-teal' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })
                )}
            </nav>
        </div>
    )
}
