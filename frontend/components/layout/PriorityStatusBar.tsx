'use client'

import React from 'react'
import { useFocusContext } from '@/context/FocusContext'
import { useViewMode } from '@/context/ViewModeContext'
import { Monitor, Table, Paperclip, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PriorityStatusBar() {
    const { focusedLabel } = useFocusContext()
    const { viewMode, toggleViewMode } = useViewMode()

    return (
        <div className="fixed bottom-0 left-0 right-0 h-7 bg-[#ECF0F1] border-t border-[#BDC3C7] text-[#2C3E50] text-xs flex items-center justify-between px-2 font-medium select-none z-50" dir="rtl">
            {/* Right side: Screen info & navigation */}
            <div className="flex items-center gap-1">
                {/* Active screens indicator */}
                <button className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#D5DBDB] rounded transition-colors">
                    <Monitor className="w-3 h-3 text-[#2980B9]" />
                    <span className="text-[11px]">מסכים פעילים</span>
                    <span className="bg-[#2980B9] text-white text-[9px] px-1.5 py-0 rounded-full font-bold min-w-[16px] text-center">1</span>
                </button>

                <div className="w-px h-4 bg-[#BDC3C7] mx-0.5" />

                {/* Recent changes */}
                <button className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#D5DBDB] rounded transition-colors">
                    <RefreshCw className="w-3 h-3 text-[#7F8C8D]" />
                    <span className="text-[11px]">שינויים אחרונים</span>
                </button>

                <div className="w-px h-4 bg-[#BDC3C7] mx-0.5" />

                {/* Recently used */}
                <button className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[#D5DBDB] rounded transition-colors">
                    <Clock className="w-3 h-3 text-[#7F8C8D]" />
                    <span className="text-[11px]">בשימוש לאחרונה</span>
                </button>
            </div>

            {/* Left side: Field info & record position */}
            <div className="flex items-center gap-3">
                {/* Attachments */}
                <button className="p-0.5 hover:bg-[#D5DBDB] rounded transition-colors">
                    <Paperclip className="w-3.5 h-3.5 text-[#7F8C8D]" />
                </button>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* Field label */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7F8C8D]">שדה</span>
                    <span className="text-[11px] font-bold text-[#2C3E50]">{focusedLabel || ''}</span>
                </div>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* Record position */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7F8C8D]">תוצאות</span>
                    <span className="text-[11px] font-bold">1 / 1</span>
                </div>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* DNG Hub branding */}
                <span className="text-[10px] font-bold text-[#2980B9] tracking-wider">dng hub</span>
            </div>
        </div>
    )
}
