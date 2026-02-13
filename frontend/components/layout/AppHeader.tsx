'use client'

import React from 'react'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { OrganizationSelector } from './OrganizationSelector'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/auth'
import { searchMenuEntities, searchOrganizational } from '@/lib/api'
import type { OrganizationalSearchResult, SearchMenuResult } from '@/lib/types/models'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
                ],
            },
            {
                label: 'מבנה ארגוני',
                items: [
                    { label: 'מחלקות', href: '/dashboard/core/departments' },
                    { label: 'חטיבות', href: '/dashboard/core/divisions' },
                    { label: 'אגפים', href: '/dashboard/core/wings' },
                    { label: 'צוותים', href: '/dashboard/core/teams' },
                    { label: 'אשף הקמה', href: '/dashboard/core/wizard' },
                ],
            },
            {
                label: 'תשתית ארגונית',
                items: [
                    { label: 'עמדות', href: '/dashboard/core/positions' },
                    { label: 'תפקידים', href: '/dashboard/core/roles' },
                    { label: 'דרגות', href: '/dashboard/core/grades' },
                    { label: 'תארים', href: '/dashboard/core/titles' },
                ],
            },
        ],
    },
    {
        label: 'Flow',
        href: '/dashboard/flow',
        subItems: [
            {
                label: 'גיוס וקליטה',
                items: [
                    { label: 'מועמדים', href: '/dashboard/flow/candidates' },
                    { label: 'Onboarding', href: '/dashboard/flow/onboarding' },
                    { label: 'חוזים', href: '/dashboard/flow/contracts' },
                ],
            },
        ],
    },
    {
        label: 'Docs',
        href: '/dashboard/docs',
        subItems: [
            {
                label: 'מסמכים',
                items: [
                    { label: 'תבניות', href: '/dashboard/docs/templates' },
                    { label: 'מסמכים מופקים', href: '/dashboard/docs/instances' },
                ],
            },
        ],
    },
    {
        label: 'Vision',
        href: '/dashboard/vision',
        subItems: [
            {
                label: 'ויזואליזציה',
                items: [
                    { label: 'Org Chart', href: '/dashboard/vision/org-chart' },
                    { label: 'Gap Analysis', href: '/dashboard/vision/gap-analysis' },
                ],
            },
        ],
    },
    {
        label: 'Assets',
        href: '/dashboard/assets',
        subItems: [
            {
                label: 'נכסים',
                items: [
                    { label: 'ציוד IT', href: '/dashboard/assets/items' },
                    { label: 'צי רכב', href: '/dashboard/assets/vehicles' },
                ],
            },
        ],
    },
    {
        label: 'Vibe',
        href: '/dashboard/vibe',
        subItems: [
            {
                label: 'רווחה',
                items: [
                    { label: 'פורטל עובד', href: '/dashboard/vibe/portal' },
                    { label: 'אירועים', href: '/dashboard/vibe/events' },
                    { label: 'Pulse', href: '/dashboard/vibe/pulse' },
                ],
            },
        ],
    },
    {
        label: 'Grow',
        href: '/dashboard/grow',
        subItems: [
            {
                label: 'פיתוח ביצועים',
                items: [
                    { label: 'מחזורים', href: '/dashboard/grow/cycles' },
                    { label: 'הערכות', href: '/dashboard/grow/reviews' },
                    { label: 'יעדים', href: '/dashboard/grow/goals' },
                ],
            },
        ],
    },
    {
        label: 'Insights',
        href: '/dashboard/insights',
        subItems: [
            {
                label: 'BI & Analytics',
                items: [
                    { label: 'KPIs', href: '/dashboard/insights/kpis' },
                    { label: 'Widgets', href: '/dashboard/insights/dashboards' },
                    { label: 'Reports', href: '/dashboard/insights/reports' },
                ],
            },
        ],
    },
    { label: 'הודעות', href: '/announcements' },
    { label: 'פרופיל', href: '/dashboard/profile' },
    { label: 'ניהול מערכת', href: '/admin/dashboard', requiresSuperAdmin: true },
]

function CollapsibleNavGroup({ group, pathname, onLinkClick }: { group: any; pathname: string | null; onLinkClick: () => void }) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const hasActiveChild = group.items.some((item: any) => pathname === item.href)

    React.useEffect(() => {
        if (hasActiveChild) {
            setIsExpanded(true)
        }
    }, [hasActiveChild])

    return (
        <div className="px-2 py-1">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') setIsExpanded(true)
                    if (e.key === 'Escape') setIsExpanded(false)
                }}
                className="group flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
            >
                {group.label}
                <ChevronDown className={cn('h-3 w-3 transition-transform duration-200 opacity-50 group-hover:opacity-100', isExpanded && 'rotate-180')} />
            </button>

            {isExpanded && (
                <div className="mt-1 space-y-0.5 pl-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    {group.items.map((item: any) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={cn(
                                'block rounded border-l-2 border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-white/5',
                                pathname === item.href
                                    ? 'border-primary bg-white/5 text-primary'
                                    : 'text-gray-400 hover:border-white/10 hover:text-white'
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

function ModuleNavItem({ module, pathname }: { module: any; pathname: string | null }) {
    const isActive = pathname?.startsWith(module.href)
    const [open, setOpen] = React.useState(false)

    if (!module.subItems) {
        return (
            <Link
                href={module.href}
                className={cn(
                    'relative flex h-full items-center whitespace-nowrap border-b-2 px-5 text-sm font-medium transition-colors',
                    isActive ? 'border-primary bg-white/5 text-primary' : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
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
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') setOpen(true)
                        if (e.key === 'Escape') setOpen(false)
                    }}
                    className={cn(
                        'flex h-full items-center gap-1.5 whitespace-nowrap border-b-2 px-5 text-sm font-medium transition-colors outline-none',
                        open || isActive
                            ? 'border-primary bg-white/5 text-primary'
                            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                >
                    {module.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="mt-0 w-64 rounded-b-md border-white/10 bg-[#2C3E50] p-0 shadow-xl" align="end" sideOffset={0}>
                <div className="custom-scrollbar flex max-h-[calc(100vh-200px)] flex-col overflow-y-auto py-2">
                    {module.subItems.map((group: any, idx: number) => (
                        <React.Fragment key={idx}>
                            <CollapsibleNavGroup group={group} pathname={pathname} onLinkClick={() => setOpen(false)} />
                            {idx < module.subItems.length - 1 && <div className="mx-4 my-1 h-px bg-white/5" />}
                        </React.Fragment>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function AppHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [displayName, setDisplayName] = React.useState('משתמש')
    const [isAdmin, setIsAdmin] = React.useState(false)

    const [searchMode, setSearchMode] = React.useState<'menu' | 'org'>('menu')
    const [searchTerm, setSearchTerm] = React.useState('')
    const [menuResults, setMenuResults] = React.useState<SearchMenuResult[]>([])
    const [orgResults, setOrgResults] = React.useState<Record<string, OrganizationalSearchResult[]>>({})
    const [flatOrgResults, setFlatOrgResults] = React.useState<OrganizationalSearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)

    React.useEffect(() => {
        const loadUserContext = async () => {
            const [{ data: { user } }, admin] = await Promise.all([supabase.auth.getUser(), isSuperAdmin()])
            setIsAdmin(admin)
            const name = user?.user_metadata?.first_name || user?.email?.split('@')[0]
            if (name) setDisplayName(name)
        }
        loadUserContext()
    }, [])

    React.useEffect(() => {
        const run = async () => {
            if (!currentOrg?.id || !searchTerm.trim()) {
                setMenuResults([])
                setOrgResults({})
                setFlatOrgResults([])
                return
            }
            try {
                if (searchMode === 'menu') {
                    const items = await searchMenuEntities(currentOrg.id, searchTerm.trim())
                    setMenuResults(items)
                    setFlatOrgResults([])
                } else {
                    const groups = await searchOrganizational(currentOrg.id, searchTerm.trim())
                    setOrgResults(groups)
                    setMenuResults([])
                    const flat = Object.values(groups).flat()
                    setFlatOrgResults(flat)
                }
                setIsSearchOpen(true)
                setSelectedIndex(0)
            } catch (error) {
                console.error('Search failed', error)
            }
        }

        const timer = setTimeout(run, 180)
        return () => clearTimeout(timer)
    }, [searchMode, searchTerm, currentOrg?.id])

    const effectiveResults = searchMode === 'menu'
        ? menuResults.map((item) => ({ title: item.label, subtitle: item.entity_type, route: item.route }))
        : flatOrgResults

    const handleNavigateSearchResult = (index: number) => {
        const item = effectiveResults[index]
        if (!item) return
        setIsSearchOpen(false)
        setSearchTerm('')
        router.push(item.route)
    }

    return (
        <div className="z-50 flex flex-col shadow-md">
            <div className="flex h-12 items-center justify-between border-b border-white/10 bg-secondary px-4 text-white">
                <div className="flex items-center gap-4">
                    <button className="rounded p-1 transition-colors hover:bg-white/10">
                        <Menu className="h-6 w-6 text-gray-300" />
                    </button>

                    <Link href="/dashboard" className="flex cursor-pointer items-center gap-2.5" dir="ltr">
                        <div className="text-[28px] font-black leading-none tracking-tighter text-white">
                            CLICK<span className="text-[#00A896]">.</span>
                        </div>
                        <div className="h-5 w-px bg-[#BDC3C7]" />
                        <div className="text-xs font-medium leading-[1.2] text-gray-300">DNG<br />HUB</div>
                    </Link>
                </div>

                <div className="relative mx-6 max-w-2xl flex-1" onKeyDown={(e) => {
                    if (!isSearchOpen) return
                    if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, effectiveResults.length - 1)))
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        setSelectedIndex((prev) => Math.max(prev - 1, 0))
                    } else if (e.key === 'Enter') {
                        e.preventDefault()
                        handleNavigateSearchResult(selectedIndex)
                    } else if (e.key === 'Escape') {
                        e.preventDefault()
                        setIsSearchOpen(false)
                    }
                }}>
                    <div className="mb-1 flex items-center gap-1 text-[10px]">
                        <button
                            onClick={() => setSearchMode('menu')}
                            className={cn('rounded px-2 py-0.5', searchMode === 'menu' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10')}
                        >
                            חיפוש ישות
                        </button>
                        <button
                            onClick={() => setSearchMode('org')}
                            className={cn('rounded px-2 py-0.5', searchMode === 'org' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10')}
                        >
                            חיפוש ארגוני
                        </button>
                    </div>
                    <div className="relative h-8">
                        <input
                            type="text"
                            placeholder={searchMode === 'menu' ? 'חיפוש מסכים ופעולות...' : 'חיפוש עובדים, יחידות, משרות...' }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            className="h-full w-full rounded border border-transparent bg-secondary-light/60 px-3 pl-9 text-sm text-white placeholder-gray-400 transition-all focus:border-primary focus:bg-secondary-light focus:outline-none"
                        />
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {isSearchOpen && !!searchTerm.trim() && (
                        <div className="absolute left-0 right-0 top-[42px] z-[80] max-h-[360px] overflow-auto rounded-md border border-[#c7dce8] bg-white shadow-xl" dir="rtl">
                            {searchMode === 'org' && Object.entries(orgResults).map(([groupKey, rows]) => (
                                <div key={groupKey}>
                                    <div className="bg-[#f4fafe] px-3 py-1 text-[11px] font-bold text-[#1f4964]">{groupKey}</div>
                                    {rows.map((row) => {
                                        const index = effectiveResults.findIndex(
                                            (r) => r.route === row.route && r.title === row.title && r.subtitle === row.subtitle
                                        )
                                        return (
                                            <button
                                                key={row.id}
                                                onClick={() => handleNavigateSearchResult(index)}
                                                className={cn(
                                                    'block w-full border-b border-[#eef5f9] px-3 py-2 text-right text-xs hover:bg-[#f8fcff]',
                                                    index === selectedIndex && 'bg-[#eaf4fb]'
                                                )}
                                            >
                                                <div className="font-semibold text-[#1f4964]">{row.title}</div>
                                                <div className="text-[#688399]">{row.subtitle}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}

                            {searchMode === 'menu' && menuResults.map((item, index) => (
                                <button
                                    key={item.entity_key + item.route}
                                    onClick={() => handleNavigateSearchResult(index)}
                                    className={cn(
                                        'block w-full border-b border-[#eef5f9] px-3 py-2 text-right text-xs hover:bg-[#f8fcff]',
                                        index === selectedIndex && 'bg-[#eaf4fb]'
                                    )}
                                >
                                    <div className="font-semibold text-[#1f4964]">{item.label}</div>
                                    <div className="text-[#688399]">{item.route}</div>
                                </button>
                            ))}

                            {effectiveResults.length === 0 && (
                                <div className="px-3 py-2 text-xs text-[#688399]">לא נמצאו תוצאות</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button className="rounded p-1.5 transition-colors hover:bg-white/10" title="התראות">
                        <Bell className="h-5 w-5 text-gray-300" />
                    </button>
                    <div className="mx-1 h-5 w-px bg-white/10" />
                    <div className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-white/10">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold ring-1 ring-white/20">
                            {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="hidden text-sm text-gray-200 sm:block">{displayName}</span>
                    </div>
                    <div className="mx-1 h-5 w-px bg-white/10" />
                    <OrganizationSelector />
                </div>
            </div>

            <div className="no-scrollbar flex h-10 items-center overflow-x-auto border-t border-white/5 bg-secondary px-4 shadow-sm">
                <nav className="flex h-full items-center">
                    {MODULES.filter((module) => {
                        if (module.requiresSuperAdmin && !isAdmin) return false

                        const moduleKey = module.href.split('/').pop()
                        const actualKey = moduleKey === 'documents' ? 'docs' : moduleKey

                        if (
                            module.href === '/announcements' ||
                            module.href === '/dashboard/profile' ||
                            module.href === '/admin/dashboard'
                        ) {
                            return true
                        }

                        if (!currentOrg?.active_modules) return true
                        return currentOrg.active_modules.includes(actualKey!)
                    }).map((module) => (
                        <ModuleNavItem key={module.label} module={module} pathname={pathname} />
                    ))}
                </nav>
            </div>
        </div>
    )
}
