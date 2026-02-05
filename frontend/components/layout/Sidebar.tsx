'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Building2,
    Workflow,
    FileText,
    Eye,
    Package,
    Heart,
    TrendingUp,
    BarChart3,
    Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULES = [
    { label: 'Click Core', href: '/dashboard/core', icon: Building2 },
    { label: 'Click Flow', href: '/dashboard/flow', icon: Workflow },
    { label: 'Click Docs', href: '/dashboard/documents', icon: FileText },
    { label: 'Click Vision', href: '/dashboard/vision', icon: Eye },
    { label: 'Click Assets', href: '/dashboard/assets', icon: Package },
    { label: 'Click Vibe', href: '/dashboard/vibe', icon: Heart },
    { label: 'Click Grow', href: '/dashboard/grow', icon: TrendingUp },
    { label: 'Click Insights', href: '/dashboard/insights', icon: BarChart3 },
    // Settings or Admin often separate, but user didn't explicitly forbid it. 
    // "Populate Navigation ONLY with CLICK's modules: Core, Flow, Docs, Vision, Assets, Vibe, Grow, Insights."
    // I will adhere strictly to the list, but Admin is usually needed. 
    // User said: "Populate Navigation ONLY with CLICK's modules..."
    // I will leave Admin out of the main list or maybe put it at the bottom as a utility, 
    // BUT strictly, I should likely remove it from the *main* list if the user was very specific.
    // However, I will keep it conditional or at the bottom if previously present. 
    // The user said "ONLY", SO I WILL REMOVE 'Admin' from this list to be safe, 
    // or maybe the user considers Admin a utility.
    // Let's stick to the list provided: Core, Flow, Docs, Vision, Assets, Vibe, Grow, Insights.
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-56 bg-secondary text-white flex flex-col h-full shadow-lg z-40 border-l border-white/10">
            {/* No Logo here - moved to Header */}
            <div className="flex-1 overflow-y-auto py-2">
                <div className="space-y-0.5">
                    {MODULES.map((module) => {
                        const isActive = pathname?.startsWith(module.href)
                        const Icon = module.icon

                        return (
                            <Link
                                key={module.href}
                                href={module.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 border-r-4",
                                    isActive
                                        ? "bg-secondary-light border-primary text-white font-medium"
                                        : "border-transparent text-gray-400 hover:bg-secondary-light/50 hover:text-white"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-gray-400 group-hover:text-white")} />
                                <span>{module.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
