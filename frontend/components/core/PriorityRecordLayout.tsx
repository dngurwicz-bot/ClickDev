'use client'

import React, { useEffect } from 'react'
import { Printer, Paperclip, X, Trash2, Search, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useScreenExit } from '@/lib/screen-lifecycle/useScreenExit'

interface PriorityRecordLayoutProps {
    title: string
    subtitle?: string
    id?: string
    status?: string
    onSave?: () => Promise<void> | void
    onPrint?: () => void
    onCancel?: () => void
    onDelete?: () => void
    onSearch?: () => void
    onToggleView?: () => void
    actions?: React.ReactNode // Slot for extra actions
    children: React.ReactNode
    isDirty?: boolean
    suppressEnterSave?: boolean
    fallbackRoute?: string
    onRequestExit?: () => void
    onDiscard?: () => void
}

export function PriorityRecordLayout({
    title,
    subtitle,
    id,
    status,
    onSave,
    onPrint,
    onCancel,
    onDelete,
    onSearch,
    onToggleView,
    actions,
    children,
    isDirty,
    suppressEnterSave: _suppressEnterSave,
    fallbackRoute = '/dashboard',
    onRequestExit,
    onDiscard,
}: PriorityRecordLayoutProps) {
    const {
        isConfirmOpen,
        requestExit,
        handleConfirmSave,
        handleConfirmDiscard,
        handleConfirmCancel,
    } = useScreenExit({
        isDirty,
        save: async () => {
            await onSave?.()
        },
        onDiscard,
        onExit: onCancel,
        fallbackRoute,
        enableEscape: false,
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if a modal is open (modal handles its own ESC)
            if (document.querySelector('.fixed.inset-0.z-50') || document.querySelector('.fixed.inset-0.z-\\[60\\]')) return

            // --- ESC: close/cancel ---
            if (e.key === 'Escape') {
                e.preventDefault()
                ;(onRequestExit ?? requestExit)()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onRequestExit, requestExit])

    return (
        <div className="bg-bg-main min-h-full flex flex-col font-sans" dir="rtl">
            {/* Unified Header Bar */}
            <div className="h-14 bg-[#2E455D] border-b border-[#274055] flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
                {/* Right Side: Title & Info */}
                <div className="flex items-center gap-6 overflow-hidden">
                    {/* Title */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white font-bold text-lg tracking-wide">{title}</span>
                    </div>

                    {/* Vertical Divider */}
                    <div className="w-px h-6 bg-white/10"></div>

                    {/* Employee Info Compact */}
                    {(id || subtitle) && (
                        <div className="flex items-center gap-6 text-sm text-gray-100 overflow-hidden">
                            {/* ID */}
                            {id && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[#AFC1CF] text-xs font-medium uppercase">מספר עובד:</span>
                                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold border border-white/10">{id}</span>
                                </div>
                            )}

                            {/* Name */}
                            {subtitle && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[#AFC1CF] text-xs font-medium uppercase">שם:</span>
                                    <span className="font-bold text-white whitespace-nowrap">{subtitle}</span>
                                </div>
                            )}

                            {/* Status */}
                            {status && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[#AFC1CF] text-xs font-medium uppercase">סטטוס:</span>
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                        <div className={cn("w-2 h-2 rounded-full", status === 'active' ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-gray-400")}></div>
                                        <span className="text-xs font-medium">{status === 'active' ? 'פעיל' : 'לא פעיל'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Left Side: Actions */}
                <div className="flex items-center gap-1">
                    <button onClick={onSearch} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded transition-colors group" title="חיפוש">
                        <Search className="w-4 h-4 text-[#D3DEE6] group-hover:text-white" />
                        <span className="text-xs font-medium text-[#D3DEE6] group-hover:text-white hidden xl:block">חיפוש</span>
                    </button>

                    {actions}

                    <button onClick={onToggleView} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded transition-colors group" title="תצוגת טבלה (F2)">
                        <LayoutGrid className="w-4 h-4 text-[#D3DEE6] group-hover:text-white" />
                        <span className="text-xs font-medium text-[#D3DEE6] group-hover:text-white hidden xl:block">תצוגה</span>
                    </button>

                    <button onClick={onPrint} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded transition-colors group" title="הדפס">
                        <Printer className="w-4 h-4 text-[#D3DEE6] group-hover:text-white" />
                        <span className="text-xs font-medium text-[#D3DEE6] group-hover:text-white hidden xl:block">הדפס</span>
                    </button>

                    <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded transition-colors group" title="נספחים">
                        <Paperclip className="w-4 h-4 text-[#D3DEE6] group-hover:text-white" />
                        <span className="text-xs font-medium text-[#D3DEE6] group-hover:text-white hidden xl:block">נספחים</span>
                    </button>

                    <div className="w-px h-5 bg-white/10 mx-1"></div>

                    <button onClick={onRequestExit ?? requestExit} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 rounded transition-colors group" title="בטל (ESC)">
                        <X className="w-4 h-4 text-[#D3DEE6] group-hover:text-red-300" />
                        <span className="text-xs font-medium text-[#D3DEE6] group-hover:text-red-300 hidden xl:block">בטל</span>
                    </button>

                    <button onClick={onDelete} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 rounded transition-colors group" title="מחק">
                        <Trash2 className="w-4 h-4 text-[#D3DEE6] group-hover:text-red-300" />
                        <span className="text-xs font-medium text-[#D3DEE6] group-hover:text-red-300 hidden xl:block">מחק</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {children}
            </div>

            {/* Unsaved Changes Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onConfirm={handleConfirmSave}
                onDiscard={handleConfirmDiscard}
                onCancel={handleConfirmCancel}
            />
        </div>
    )
}
