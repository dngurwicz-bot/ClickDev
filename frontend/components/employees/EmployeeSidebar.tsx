'use client'

import { cn } from '@/lib/utils'
import {
    UserPlus,
    Settings,
    FileText,
    Download,
    Upload,
    Printer,
    Search,
    Filter,
    BarChart3,
    Clock
} from 'lucide-react'
import { useState } from 'react'

interface ActionItem {
    id: string
    code: string
    label: string
    icon: typeof UserPlus
    onClick?: () => void
}

interface EmployeeSidebarProps {
    onAction?: (actionId: string) => void
}

export default function EmployeeSidebar({ onAction }: EmployeeSidebarProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const actions: ActionItem[] = [
        { id: 'add', code: '001', label: 'פתיחת עובד חדש', icon: UserPlus },
        { id: 'search', code: '002', label: 'חיפוש מתקדם', icon: Search },
        { id: 'filter', code: '003', label: 'סינון עובדים', icon: Filter },
        { id: 'report', code: '004', label: 'דוחות עובדים', icon: BarChart3 },
        { id: 'history', code: '005', label: 'היסטוריית שינויים', icon: Clock },
        { id: 'import', code: '006', label: 'ייבוא עובדים', icon: Upload },
        { id: 'export', code: '007', label: 'ייצוא לאקסל', icon: Download },
        { id: 'print', code: '008', label: 'הדפסה', icon: Printer },
        { id: 'documents', code: '009', label: 'ניהול מסמכים', icon: FileText },
        { id: 'settings', code: '010', label: 'הגדרות', icon: Settings },
    ]

    const handleClick = (action: ActionItem) => {
        setSelectedId(action.id)
        onAction?.(action.id)
    }

    return (
        <div className="flex flex-col h-full bg-surface font-sans" dir="rtl">
            <div className="p-4 border-b border-border">
                <h3 className="font-bold text-secondary text-sm flex items-center gap-2 uppercase tracking-wide">
                    <Settings className="h-4 w-4 text-primary" />
                    תפריט פעולות
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1">
                    {actions.map((action) => {
                        const Icon = action.icon
                        return (
                            <div
                                key={action.id}
                                onClick={() => handleClick(action)}
                                className={cn(
                                    "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all",
                                    selectedId === action.id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-gray-50 text-text-secondary hover:text-primary"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-md font-bold min-w-[32px] text-center transition-colors",
                                    selectedId === action.id
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 text-text-muted group-hover:bg-primary/20 group-hover:text-primary"
                                )}>
                                    {action.code}
                                </span>
                                <Icon className={cn(
                                    "h-4 w-4 transition-transform group-hover:scale-105",
                                    selectedId === action.id ? "text-primary" : "text-text-muted group-hover:text-primary"
                                )} />
                                <span className="text-sm">
                                    {action.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-border bg-gray-50/50 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
                CLICK CORE • Employee Module
            </div>
        </div>
    )
}
