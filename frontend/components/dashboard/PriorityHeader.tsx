'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Search,
    Bell,
    Settings,
    HelpCircle,
    Grid,
    ChevronDown,
    Home,
    Menu,
    X,
    LayoutDashboard,
    Users,
    Network,
    GraduationCap,
    ArrowLeft
} from 'lucide-react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

// Define the menu structure compatible with the old Sidebar logic but for Top Nav
const MAIN_MODULES = [
    { label: 'כספים', href: '/dashboard/finance' },
    { label: 'קשרי לקוחות', href: '/dashboard/crm' },
    { label: 'מכירות', href: '/dashboard/sales' },
    { label: 'ניהול פרויקטים', href: '/dashboard/projects' },
    { label: 'רכש', href: '/dashboard/procurement' },
    { label: 'ניהול מלאי', href: '/dashboard/inventory' },
    { label: 'שירות ואחזקה', href: '/dashboard/service' },
    { label: 'ייצור', href: '/dashboard/production' },
    { label: 'משאבי אנוש', href: '/dashboard/core', active: true }, // Active for this demo
    { label: 'ניהול משרד', href: '/dashboard/office' },
    { label: 'דו"חות מנהלים', href: '/dashboard/reports' },
    { label: 'מנהל המערכת', href: '/admin' },
]

export default function PriorityHeader() {
    const { currentOrg } = useOrganization()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Secondary Menu Items (The "sub-module" items that were in the sidebar)
    // We only show these if we are in the "Employee/Core" module area
    const showHumanResourcesMenu = pathname?.startsWith('/dashboard/core')

    return (
        <div className="flex flex-col w-full z-50 sticky top-0 font-sans" dir="rtl">
            {/* 1. TOP GLOBAL BAR (Dark Blue) */}
            <div className="bg-[#1a237e] text-white h-12 flex items-center justify-between px-4 shadow-md shrink-0">

                {/* Right Side: Logo & Main Navigation */}
                <div className="flex items-center gap-6 overflow-hidden">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2 font-black text-xl tracking-tight shrink-0">
                        <div className="bg-gradient-to-tr from-cyan-400 to-blue-500 w-8 h-8 rounded-lg flex items-center justify-center text-white">
                            <span className="text-lg">P</span>
                        </div>
                        <span className="hidden md:block">Priority</span>
                    </div>

                    {/* Main Module Tabs (Desktop) */}
                    <div className="hidden xl:flex items-center overflow-x-auto no-scrollbar mask-linear-fade">
                        {MAIN_MODULES.map((module) => (
                            <Link
                                key={module.label}
                                href={module.href}
                                className={`px-3 py-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-4 ${module.active
                                        ? 'border-cyan-400 text-white bg-white/10'
                                        : 'border-transparent text-blue-100 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {module.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Center: Global Search */}
                <div className="flex-1 max-w-xl mx-4 relative hidden md:block">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="חיפוש לקוחות, מוצרים, מסמכים ועוד..."
                            className="w-full h-8 bg-[#283593] border border-[#3949ab] rounded text-sm text-white placeholder-blue-200 px-10 focus:outline-none focus:border-cyan-400 focus:bg-[#303f9f] transition-all"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" />
                    </div>
                </div>

                {/* Left Side: User & System Icons */}
                <div className="flex items-center gap-3 shrink-0">
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-blue-100">
                        <Bell className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-blue-100">
                        <HelpCircle className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-white/20 mx-1" />
                    <button className="flex items-center gap-2 p-1 pl-2 hover:bg-white/10 rounded-full transition-colors bg-[#303f9f] border border-[#3949ab]">
                        <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                            DG
                        </div>
                        <span className="text-xs font-bold px-1 hidden lg:block">diego</span>
                        <ChevronDown className="w-3 h-3 text-blue-200" />
                    </button>
                    <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. SECONDARY BAR (White - Module Specific Actions) */}
            <div className="bg-white border-b border-gray-200 h-10 flex items-center px-4 justify-between shadow-sm shrink-0">

                {/* Left: Quick Actions / Breadcrumbs substitute */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {/* Organization Badge */}
                    <div className="bg-[#1a237e] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                        {currentOrg?.name || 'dng hub'}
                    </div>

                    <div className="h-4 w-px bg-gray-300 mx-2" />

                    {/* Module Menu Items (Replacing Sidebar) */}
                    {showHumanResourcesMenu && (
                        <div className="flex items-center gap-1">
                            <Link href="/dashboard/core" className="flex items-center gap-1.5 px-3 py-1 text-sm font-bold text-gray-600 hover:text-[#1a237e] hover:bg-blue-50 rounded transition-colors">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>ראשי</span>
                            </Link>

                            <Link href="/dashboard/core/employees" className={`flex items-center gap-1.5 px-3 py-1 text-sm font-bold rounded transition-colors ${pathname?.includes('/employees')
                                    ? 'text-[#1a237e] bg-blue-50 ring-1 ring-blue-100'
                                    : 'text-gray-600 hover:text-[#1a237e] hover:bg-blue-50'
                                }`}>
                                <Users className="w-4 h-4" />
                                <span>כרטיס עובד</span>
                            </Link>

                            <div className="relative group">
                                <button className="flex items-center gap-1.5 px-3 py-1 text-sm font-bold text-gray-600 hover:text-[#1a237e] hover:bg-blue-50 rounded transition-colors">
                                    <Network className="w-4 h-4" />
                                    <span>מבנה ארגוני</span>
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                {/* Dropdown for Structure */}
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-md hidden group-hover:block z-50 py-1">
                                    <Link href="/dashboard/core/wizard" className="block px-4 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-[#1a237e] text-right">אשף הקמה</Link>
                                    <Link href="/dashboard/core/structure-def" className="block px-4 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-[#1a237e] text-right">הגדרת מבנה</Link>
                                    <div className="h-px bg-gray-100 my-1" />
                                    <Link href="/dashboard/core/departments" className="block px-4 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-[#1a237e] text-right">מחלקות</Link>
                                    <Link href="/dashboard/core/teams" className="block px-4 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-[#1a237e] text-right">צוותים</Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Toolbar Actions matches Priority "Printer, Excel, Etc" */}
                <div className="flex items-center gap-1 text-gray-500">
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400" title="הדפסת מדבקות">
                        <span className="text-xs font-semibold px-1">הדפסת מדבקות</span>
                    </button>
                    <div className="h-3 w-px bg-gray-300 mx-1" />
                    <button className="p-1.5 hover:bg-gray-100 rounded" title="אוטומציות">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-xs font-bold">
                        <span>חיפושים שמורים</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}
