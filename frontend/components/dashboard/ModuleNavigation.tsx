'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import {
    ChevronDown,
    ChevronLeft,
    Search
} from 'lucide-react'

type ModuleItem = {
    label: string
    href: string
    children?: ModuleItem[]
}

type Module = {
    id: string
    label: string
    href: string
    children?: ModuleItem[]
}

// Define modules based on the dashboard list
const MODULES: Module[] = [
    {
        id: 'core',
        label: 'ליבה (Core)',
        href: '/dashboard/core',
        children: [
            { label: 'ראשי', href: '/dashboard/core' },
            { label: 'תיק עובד', href: '/dashboard/core/employees' },
            {
                label: 'מבנה ארגוני',
                href: '/dashboard/core/structure-def',
                children: [
                    { label: 'אשף הקמה מבנה ארגוני', href: '/dashboard/core/wizard' },
                    { label: 'הגדרת מבנה ארגוני', href: '/dashboard/core/structure-def' },
                    { label: 'טבלת חטיבות', href: '/dashboard/core/divisions' },
                    { label: 'טבלת אגפים', href: '/dashboard/core/wings' },
                    { label: 'טבלת מחלקות', href: '/dashboard/core/departments' },
                    { label: 'טבלת צוותים', href: '/dashboard/core/teams' },
                    { label: 'תקנים בארגון', href: '/dashboard/core/positions' },
                    { label: 'טבלת תפקידים', href: '/dashboard/core/titles' },
                    { label: 'דירוגי תפקיד', href: '/dashboard/core/grades' },
                ]
            },
            { label: 'קטלוג משרות', href: '/dashboard/core/catalog' },
        ]
    },
    { id: 'flow', label: 'Flow', href: '/dashboard/flow' },
    { id: 'docs', label: 'מסמכים (Documents)', href: '/dashboard/documents' },
    { id: 'vision', label: 'Vision', href: '/dashboard/vision' },
    { id: 'assets', label: 'נכסים (Assets)', href: '/dashboard/assets' },
    { id: 'vibe', label: 'Vibe', href: '/dashboard/vibe' },
    { id: 'grow', label: 'Grow', href: '/dashboard/grow' },
    { id: 'insights', label: 'Insights', href: '/dashboard/insights' },
]

export default function ModuleNavigation() {
    const pathname = usePathname()
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [openSubDropdown, setOpenSubDropdown] = useState<string | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = (moduleId: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setOpenDropdown(moduleId)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setOpenDropdown(null)
            setOpenSubDropdown(null)
        }, 150)
    }

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm relative z-40" dir="rtl">
            <div className="px-4 flex items-center justify-between h-10">
                {/* Module Links */}
                <nav className="flex items-center gap-1 h-full">
                    {MODULES.map((module) => {
                        const isActive = pathname.startsWith(module.href)
                        const isOpen = openDropdown === module.id
                        const hasChildren = module.children && module.children.length > 0

                        return (
                            <div
                                key={module.id}
                                className="relative h-full flex items-center"
                                onMouseEnter={() => hasChildren && handleMouseEnter(module.id)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Link
                                    href={module.href}
                                    className={`
                                        h-full flex items-center px-4 text-xs font-medium transition-colors whitespace-nowrap border-b-2 gap-1
                                        ${isActive || isOpen
                                            ? 'border-brand-teal text-brand-teal bg-teal-50/10'
                                            : 'border-transparent text-slate-600 hover:text-brand-teal hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {module.label}
                                    {hasChildren && <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                                </Link>

                                {/* Dropdown Menu */}
                                {hasChildren && isOpen && (
                                    <div className="absolute top-full right-0 mt-[1px] w-56 bg-white border border-gray-200 shadow-lg rounded-b-md py-1 z-50">
                                        {module.children?.map((child) => {
                                            const hasSubChildren = child.children && child.children.length > 0
                                            const isSubOpen = openSubDropdown === child.label

                                            return (
                                                <div
                                                    key={child.label}
                                                    className="relative group/item"
                                                    onMouseEnter={() => hasSubChildren && setOpenSubDropdown(child.label)}
                                                    onMouseLeave={() => hasSubChildren && setOpenSubDropdown(null)}
                                                >
                                                    <Link
                                                        href={child.href}
                                                        className="flex items-center justify-between px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-teal/70 transition-colors"
                                                    >
                                                        <span>{child.label}</span>
                                                        {hasSubChildren && <ChevronLeft className="w-3 h-3 opacity-50" />}
                                                    </Link>

                                                    {/* Nested Dropdown (Flyout) */}
                                                    {hasSubChildren && isSubOpen && (
                                                        <div className="absolute top-0 right-full w-56 bg-white border border-gray-200 shadow-lg rounded-md py-1 mr-1 z-50">
                                                            {child.children?.map((subChild) => (
                                                                <Link
                                                                    key={subChild.href}
                                                                    href={subChild.href}
                                                                    className="block px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-teal/70 transition-colors"
                                                                >
                                                                    {subChild.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Right Side: Search / Tools Placeholder */}
                <div className="flex items-center gap-3 border-r border-slate-200 pr-3 h-3/4">
                    <button className="text-slate-400 hover:text-brand-teal transition-colors">
                        <Search className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
