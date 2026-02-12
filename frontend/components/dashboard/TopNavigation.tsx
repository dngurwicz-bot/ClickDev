'use client'

import { Search, Bell, Menu, User, HelpCircle, Settings, Home, Star, LogOut, ShieldAlert, Building2, ChevronDown, Check, LayoutDashboard, Package, BarChart3, ArrowRight, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { isSuperAdmin } from '@/lib/auth'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

export default function TopNavigation() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization()
    const [openOrgSelector, setOpenOrgSelector] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const checkAdmin = async () => {
            const admin = await isSuperAdmin()
            setIsAdmin(admin)
        }
        checkAdmin()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (path: string) => pathname === path
    const isAdminArea = pathname?.startsWith('/admin')

    const userDisplayName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'משתמש'

    return (
        <div className="h-14 bg-[#1f2d3a] text-white flex items-center justify-between px-4 shadow-md border-b border-white/10" dir="rtl">
            {/* Right Side: Logo & Menu Trigger */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <Logo variant="light" />
                </Link>

                {/* Organization Selector */}
                <div className="hidden md:flex items-center gap-4 mr-4 border-r border-slate-700 pr-4">
                    {isLoading ? (
                        <div className="h-6 w-24 bg-slate-700 rounded animate-pulse"></div>
                    ) : organizations.length > 1 ? (
                        <Popover open={openOrgSelector} onOpenChange={setOpenOrgSelector}>
                            <PopoverTrigger asChild>
                                <button
                                    role="combobox"
                                    aria-expanded={openOrgSelector}
                                    className="flex items-center justify-between gap-2 bg-[#2b3b4b] hover:bg-[#32485c] border border-white/20 text-white text-sm font-medium rounded-md px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors min-w-[220px]"
                                >
                                    <span className="truncate">{currentOrg?.name || "בחר ארגון..."}</span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 bg-white text-slate-900 border-slate-200">
                                <Command>
                                    <CommandInput placeholder="חפש ארגון..." />
                                    <CommandList>
                                        <CommandEmpty>לא נמצא ארגון.</CommandEmpty>
                                        <CommandGroup>
                                            {organizations.map((org) => (
                                                <CommandItem
                                                    key={org.id}
                                                    value={org.name}
                                                    onSelect={() => {
                                                        setCurrentOrg(org)
                                                        setOpenOrgSelector(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex items-center w-full">
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                currentOrg?.id === org.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {org.name}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span>{currentOrg?.name || 'טוען...'}</span>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button - Placeholder for mobile trigger logic if needed */}
                <button className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors md:hidden">
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="חיפוש עובדים, ארגונים ותפקידים..."
                        className="w-full bg-[#2b3b4b] border border-white/20 text-sm rounded-md py-1.5 pr-10 pl-4 text-white placeholder-gray-300 focus:bg-[#32485c] focus:border-primary transition-all outline-none"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-white" />
                </div>
            </div>

            {/* Left Side: Icons & Profile */}
            <div className="flex items-center gap-1">
                {isAdminArea ? (
                    <>
                        <Link href="/admin/dashboard">
                            <NavButton icon={LayoutDashboard} label="דשבורד" active={isActive('/admin/dashboard')} showLabel />
                        </Link>
                        <Link href="/admin/organizations">
                            <NavButton icon={Building2} label="ארגונים" active={isActive('/admin/organizations')} showLabel />
                        </Link>
                        <Link href="/admin/subscription-tiers">
                            <NavButton icon={Package} label="מנויים" active={isActive('/admin/subscription-tiers')} showLabel />
                        </Link>
                        <Link href="/admin/announcements">
                            <NavButton icon={Bell} label="הודעות" active={isActive('/admin/announcements')} showLabel />
                        </Link>
                        <Link href="/admin/analytics">
                            <NavButton icon={BarChart3} label="אנליטיקס" active={isActive('/admin/analytics')} showLabel />
                        </Link>
                        <Link href="/admin/system-blueprint">
                            <NavButton icon={FileText} label="Blueprint" active={isActive('/admin/system-blueprint')} showLabel />
                        </Link>
                        <Link href="/admin/settings">
                            <NavButton icon={Settings} label="הגדרות" active={isActive('/admin/settings')} showLabel />
                        </Link>

                        <div className="h-6 w-px bg-slate-700 mx-2" />

                        <Link href="/dashboard">
                            <NavButton icon={ArrowRight} label="חזרה למערכת" showLabel />
                        </Link>
                    </>
                ) : (
                    <>
                        {isAdmin && (
                            <Link href="/admin/dashboard">
                                <NavButton icon={ShieldAlert} label="ניהול מערכת" active={isActive('/admin/dashboard')} />
                            </Link>
                        )}

                        <NavButton icon={Star} label="מועדפים" onClick={() => console.log('Favorites clicked')} />

                        <Link href="/dashboard">
                            <NavButton icon={Home} label="בית" active={isActive('/dashboard')} />
                        </Link>

                        <Link href="/dashboard/profile">
                            <NavButton icon={Settings} label="פרופיל" active={isActive('/dashboard/profile')} />
                        </Link>

                        <Link href="/system-blueprint">
                            <NavButton icon={FileText} label="Blueprint" active={isActive('/system-blueprint')} />
                        </Link>

                        <div className="h-6 w-px bg-slate-700 mx-2" />

                        <NavButton icon={HelpCircle} label="עזרה" onClick={() => window.open('https://click-docs.com', '_blank')} />
                        <NavButton icon={Bell} label="התראות" badge="0" onClick={() => console.log('Notifications clicked')} />
                    </>
                )}

                {/* User Area */}
                <div className="h-6 w-px bg-white/20 mx-2" />
                <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-md bg-secondary-light/60 border border-white/10">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs font-medium uppercase text-white">
                        {user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs text-gray-200">משתמש מחובר</span>
                        <span className="text-sm font-semibold text-white max-w-[140px] truncate">{userDisplayName}</span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="mr-2 inline-flex items-center gap-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2 py-1 text-xs font-medium transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        התנתקות
                    </button>
                </div>

                {/* Profile Dropdown (mobile / compact) */}
                <div className="relative lg:hidden">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 mr-2 cursor-pointer hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors border border-transparent focus:border-slate-600 outline-none"
                    >
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs font-medium uppercase">
                            {user?.email?.[0] || 'U'}
                        </div>
                        <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                            {userDisplayName}
                        </span>
                    </button>

                    {isProfileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsProfileOpen(false)}
                            />
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-slate-700 border border-slate-200">
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-xs text-slate-500">מחובר כ-</p>
                                    <p className="font-medium text-sm truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>התנתק</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function NavButton({ icon: Icon, label, active, badge, onClick, showLabel }: { icon: any, label: string, active?: boolean, badge?: string, onClick?: () => void, showLabel?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors relative group inline-flex items-center gap-1.5 ${active ? 'bg-[#32485c] text-white' : 'text-gray-200 hover:text-white hover:bg-[#2b3b4b]'}`}
        >
            <Icon className="w-5 h-5" />
            {showLabel && <span className="hidden md:inline text-xs font-medium">{label}</span>}
            <span className="sr-only">{label}</span>
            {badge && badge !== "0" && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-secondary" />
            )}

            {/* Tooltip */}
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {label}
            </span>
        </button>
    )
}
