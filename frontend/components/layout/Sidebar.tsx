'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Building2,
    Users,
    Settings,
    Briefcase,
    ShoppingCart,
    Wrench,
    FileText,
    LayoutDashboard,
    PieChart,
    HardHat,
    Truck,
    Phone,
    Workflow,
    Eye,
    Package,
    Heart,
    TrendingUp,
    BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULES = [
    { label: 'Click Core', href: '/dashboard/core', icon: Building2, active: true },
    { label: 'Click Flow', href: '/dashboard/flow', icon: Workflow },
    { label: 'Click Docs', href: '/dashboard/documents', icon: FileText },
    { label: 'Click Vision', href: '/dashboard/vision', icon: Eye },
    { label: 'Click Assets', href: '/dashboard/assets', icon: Package },
    { label: 'Click Vibe', href: '/dashboard/vibe', icon: Heart },
    { label: 'Click Grow', href: '/dashboard/grow', icon: TrendingUp },
    { label: 'Click Insights', href: '/dashboard/insights', icon: BarChart3 },
    { label: 'ניהול מערכת', href: '/admin', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-primary text-white flex flex-col h-full shadow-2xl transition-all duration-300 z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 bg-primary-dark border-b border-primary-light/20 relative overflow-hidden">
                {/* Subtle pattern or gradient overlay could go here */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-50" />
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                        <span className="font-black text-white text-lg">C</span>
                    </div>
                    <span className="font-bold text-xl tracking-wide">Click</span>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-thumb-primary-light scrollbar-track-transparent">
                {MODULES.map((module) => {
                    const isActive = pathname?.startsWith(module.href) && (module.href !== '/dashboard' || pathname === '/dashboard')
                    const Icon = module.icon

                    return (
                        <Link
                            key={module.href}
                            href={module.href}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 transition-all duration-200 group relative",
                                isActive
                                    ? "bg-white/10 text-white shadow-inner border-r-4 border-secondary"
                                    : "text-blue-100 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-secondary" : "text-blue-300")} />
                            <span className="font-medium text-sm tracking-wide">{module.label}</span>

                            {/* Hover effect glow */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Footer / User User Summary */}
            <div className="p-4 bg-primary-dark border-t border-primary-light/20">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary-dark font-bold text-xs shadow-md">
                        DG
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Diego G.</span>
                        <span className="text-[10px] text-blue-200">Admin</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
