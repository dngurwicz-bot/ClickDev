'use client'

import React from 'react'
import { Menu, Search, Bell, ChevronDown } from 'lucide-react'
import { OrganizationSelector } from './OrganizationSelector'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'

const MODULES = [
    {
        label: 'ליבה',
        href: '/dashboard/core',
        subItems: [
            {
                label: 'עובדים',
                items: [
                    { label: 'כל העובדים', href: '/dashboard/core/employees' },
                    { label: 'עובד חדש', href: '/dashboard/core/employees?new=true' },
                ]
            },
            {
                label: 'מבנה ארגוני',
                items: [
                    { label: 'מחלקות', href: '/dashboard/core/departments' },
                    { label: 'חטיבות', href: '/dashboard/core/divisions' },
                    { label: 'אגפים', href: '/dashboard/core/wings' },
                    { label: 'צוותים', href: '/dashboard/core/teams' },
                    { label: 'אשף הקמה', href: '/dashboard/core/wizard' },
                ]
            },
            {
                label: 'תשתית ארגונית',
                items: [
                    { label: 'עמדות', href: '/dashboard/core/positions' },
                    { label: 'תפקידים', href: '/dashboard/core/roles' },
                    { label: 'דרגות', href: '/dashboard/core/grades' },
                ]
            }
        ]
    },
    { label: 'הודעות', href: '/announcements' },
    { label: 'פרופיל', href: '/dashboard/profile' },
    { label: 'ניהול מערכת', href: '/admin/dashboard', requiresSuperAdmin: true },
]

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function CollapsibleNavGroup({ group, pathname, onLinkClick }: { group: any, pathname: string | null, onLinkClick: () => void }) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const hasActiveChild = group.items.some((item: any) => pathname === item.href)

    // Auto-expand if a child is active
    React.useEffect(() => {
        if (hasActiveChild) {
            setIsExpanded(true)
        }
    }, [hasActiveChild])

    return (
        <div className="px-2 py-1">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-gray-400 hover:text-gray-200 px-2 py-1.5 rounded hover:bg-white/5 transition-colors group"
            >
                {group.label}
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-200 opacity-50 group-hover:opacity-100", isExpanded && "rotate-180")} />
            </button>

            {isExpanded && (
                <div className="space-y-0.5 mt-1 pl-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    {group.items.map((item: any) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={cn(
                                "block px-2 py-1.5 text-sm rounded hover:bg-white/5 transition-colors border-l-2 border-transparent",
                                pathname === item.href
                                    ? "text-primary border-primary bg-white/5"
                                    : "text-gray-400 hover:text-white hover:border-white/10"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

function ModuleNavItem({ module, pathname }: { module: any, pathname: string | null }) {
    const isActive = pathname?.startsWith(module.href)
    const [open, setOpen] = React.useState(false)

    if (!module.subItems) {
        return (
            <Link
                href={module.href}
                className={cn(
                    "h-full flex items-center px-5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 relative",
                    isActive
                        ? "text-primary border-primary bg-white/5"
                        : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                )}
            >
                {module.label}
            </Link>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "h-full flex items-center px-5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 gap-1.5 outline-none",
                        open || isActive
                            ? "text-primary border-primary bg-white/5"
                            : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                    )}
                >
                    {module.label}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-64 bg-[#2C3E50] border-white/10 p-0 rounded-b-md shadow-xl mt-0"
                align="end"
                sideOffset={0}
            >
                <div className="flex flex-col py-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    {module.subItems.map((group: any, idx: number) => (
                        <React.Fragment key={idx}>
                            <CollapsibleNavGroup
                                group={group}
                                pathname={pathname}
                                onLinkClick={() => setOpen(false)}
                            />
                            {idx < module.subItems.length - 1 && (
                                <div className="h-px bg-white/5 my-1 mx-4" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function PriorityHeader() {
    const pathname = usePathname()
    const { currentOrg } = useOrganization()
    const [displayName, setDisplayName] = React.useState('משתמש')
    const [isAdmin, setIsAdmin] = React.useState(false)

    React.useEffect(() => {
        const loadUserContext = async () => {
            const [{ data: { user } }, admin] = await Promise.all([
                supabase.auth.getUser(),
                isSuperAdmin()
            ])
            setIsAdmin(admin)
            const name = user?.user_metadata?.first_name || user?.email?.split('@')[0]
            if (name) setDisplayName(name)
        }
        loadUserContext()
    }, [])

    return (
        <div className="flex flex-col z-50 shadow-md">
            {/* Top Strip */}
            <div className="h-12 bg-secondary text-white flex items-center justify-between px-4 border-b border-white/10">
                {/* Right Side: Hamburger + Logo (RTL) */}
                <div className="flex items-center gap-4">
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Menu className="w-6 h-6 text-gray-300" />
                    </button>

                    <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer" dir="ltr">
                        <div className="text-[28px] font-black tracking-tighter text-white leading-none">
                            CLICK<span className="text-[#00A896]">.</span>
                        </div>

                        <div className="w-px h-5 bg-[#BDC3C7]"></div>

                        <div className="text-xs font-medium text-gray-300 leading-[1.2]">
                            DNG<br />HUB
                        </div>
                    </Link>
                </div>

                {/* Center: Search (Visual Replica) */}
                <div className="flex-1 max-w-2xl mx-6">
                    <div className="relative h-8">
                        <input
                            type="text"
                            placeholder="חיפוש מסכים ופעולות..."
                            className="w-full h-full bg-secondary-light/60 text-white placeholder-gray-400 text-sm rounded px-3 pl-9 focus:outline-none focus:bg-secondary-light border border-transparent focus:border-primary transition-all"
                        />
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Left Side: User Actions (RTL layout means these are on the left) */}
                <div className="flex items-center gap-3">
                    <button className="p-1.5 hover:bg-white/10 rounded transition-colors" title="התראות">
                        <Bell className="w-5 h-5 text-gray-300" />
                    </button>
                    <div className="h-5 w-px bg-white/10 mx-1"></div>
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/20">
                            {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-200 hidden sm:block">{displayName}</span>
                    </div>
                    <div className="h-5 w-px bg-white/10 mx-1"></div>
                    <OrganizationSelector />
                </div>
            </div>


            {/* Second Strip: Modules Navigation */}
            <div className="h-10 bg-secondary flex items-center px-4 shadow-sm border-t border-white/5 overflow-x-auto no-scrollbar">
                <nav className="flex items-center h-full">
                    {MODULES.filter(module => {
                        if (module.requiresSuperAdmin && !isAdmin) return false

                        const moduleKey = module.href.split('/').pop() // e.g. "core" from "/dashboard/core"
                        const actualKey = moduleKey === 'documents' ? 'docs' : moduleKey

                        if (module.href === '/announcements' || module.href === '/dashboard/profile' || module.href === '/admin/dashboard') {
                            return true
                        }

                        if (!currentOrg?.active_modules) return true

                        return currentOrg.active_modules.includes(actualKey!)
                    }).map((module) => (
                        <ModuleNavItem key={module.label} module={module} pathname={pathname} />
                    ))}
                </nav>
            </div>
        </div >
    )
}

