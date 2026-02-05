'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriorityDashboardTileProps {
    label: string
    href: string
    icon: LucideIcon
    description?: string
}

export function PriorityDashboardTile({ label, href, icon: Icon, description }: PriorityDashboardTileProps) {
    return (
        <Link
            href={href}
            className="group flex flex-col items-center justify-center bg-white border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-200 p-4 rounded-sm text-center h-32 w-full relative overflow-hidden"
        >
            <div className="mb-3 text-primary group-hover:scale-110 transition-transform duration-200">
                <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>

            <span className="text-secondary font-bold text-sm tracking-wide group-hover:text-primary transition-colors">
                {label}
            </span>

            {/* Decoration for "dense" feel - colored top bar on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary transform -translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
        </Link>
    )
}
