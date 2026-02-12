'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFocusContext } from '@/context/FocusContext'
import { useViewMode } from '@/context/ViewModeContext'
import { useStatusBar } from '@/context/StatusBarContext'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'
import { usePathname, useRouter } from 'next/navigation'
import { Monitor, Table, Paperclip, Clock, RefreshCw, Layers, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type PanelType = 'active' | 'changes' | 'recent' | 'hub' | null

interface StatusEntry {
    id: string
    label: string
    route: string
    timestamp: string
}

const STATUS_LOG_KEY = 'click_statusbar_changes'

function formatRouteLabel(route: string) {
    if (!route || route === '/') return 'דף הבית'
    return route
        .split('/')
        .filter(Boolean)
        .map((part) => {
            if (part === 'dashboard') return 'לוח בקרה'
            if (part === 'core') return 'ליבה'
            if (part === 'employees') return 'עובדים'
            return part.replace(/-/g, ' ')
        })
        .join(' / ')
}

function formatTimestamp(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    }).format(date)
}

export function PriorityStatusBar() {
    const { focusedLabel } = useFocusContext()
    const { viewMode, toggleViewMode } = useViewMode()
    const { recordStatus } = useStatusBar()
    const { history } = useNavigationStack()
    const router = useRouter()
    const pathname = usePathname()
    const [openPanel, setOpenPanel] = useState<PanelType>(null)
    const [statusEntries, setStatusEntries] = useState<StatusEntry[]>([])
    const [attachedFiles, setAttachedFiles] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const activeScreens = useMemo(() => {
        const unique = Array.from(new Set(history)).slice(-6)
        return unique.reverse().map((route) => ({
            route,
            label: formatRouteLabel(route),
        }))
    }, [history])

    const recentlyUsedScreens = useMemo(() => {
        return activeScreens.filter((screen) => screen.route !== pathname).slice(0, 5)
    }, [activeScreens, pathname])

    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const raw = window.localStorage.getItem(STATUS_LOG_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw) as StatusEntry[]
            if (Array.isArray(parsed)) {
                setStatusEntries(parsed.slice(0, 20))
            }
        } catch {
            setStatusEntries([])
        }
    }, [])

    useEffect(() => {
        if (!pathname) return
        const entry: StatusEntry = {
            id: `${Date.now()}_${pathname}`,
            label: `ניווט למסך: ${formatRouteLabel(pathname)}`,
            route: pathname,
            timestamp: new Date().toISOString(),
        }
        setStatusEntries((prev) => {
            const next = [entry, ...prev].slice(0, 20)
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STATUS_LOG_KEY, JSON.stringify(next))
            }
            return next
        })
    }, [pathname])

    const logStatusAction = (label: string) => {
        const entry: StatusEntry = {
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            label,
            route: pathname || '',
            timestamp: new Date().toISOString(),
        }
        setStatusEntries((prev) => {
            const next = [entry, ...prev].slice(0, 20)
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STATUS_LOG_KEY, JSON.stringify(next))
            }
            return next
        })
    }

    const navigateTo = (route: string) => {
        if (!route) return
        router.push(route)
        setOpenPanel(null)
        logStatusAction(`מעבר ממסך תחתון: ${formatRouteLabel(route)}`)
    }

    const handleActiveScreensClick = () => {
        const current = activeScreens[0]?.route
        if (current) {
            navigateTo(current)
            return
        }
        navigateTo('/dashboard')
    }

    const handleRecentChangesClick = () => {
        navigateTo('/announcements')
    }

    const handleRecentScreensClick = () => {
        const firstRecent = recentlyUsedScreens[0]
        if (firstRecent?.route) {
            navigateTo(firstRecent.route)
            return
        }
        navigateTo('/dashboard')
    }

    const handleToggleView = () => {
        toggleViewMode()
        logStatusAction(`שינוי מצב תצוגה ל-${viewMode === 'table' ? 'טופס' : 'טבלה'}`)
    }

    const handleAttach = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files?.length) return
        const names = Array.from(files).map((file) => file.name)
        setAttachedFiles(names)
        logStatusAction(`נבחרו ${names.length} קבצים מצורפים`)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-9 bg-gradient-to-r from-[#F4F7FA] to-[#EEF4F6] border-t border-[#C9D5DE] text-[#133044] text-xs flex items-center justify-between px-3 font-medium select-none z-[120] shadow-[0_-1px_6px_rgba(15,42,61,0.08)] pointer-events-auto" dir="rtl">
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
            />

            {/* Right side: Screen info & navigation */}
            <div className="flex items-center gap-1">
                {/* Active screens indicator */}
                <button
                    className={cn('flex items-center gap-1.5 px-2 py-1 rounded transition-colors', openPanel === 'active' ? 'bg-[#D6E7F2]' : 'hover:bg-[#DDEAF1]')}
                    onClick={handleActiveScreensClick}
                    type="button"
                >
                    <Monitor className="w-3 h-3 text-[#1A6EA1]" />
                    <span className="text-[11px]">מסכים פעילים</span>
                    <span className="bg-[#1A6EA1] text-white text-[9px] px-1.5 py-0 rounded-full font-bold min-w-[16px] text-center">{activeScreens.length}</span>
                </button>

                <div className="w-px h-4 bg-[#BDC3C7] mx-0.5" />

                {/* Recent changes */}
                <button
                    className={cn('flex items-center gap-1.5 px-2 py-1 rounded transition-colors', openPanel === 'changes' ? 'bg-[#D6E7F2]' : 'hover:bg-[#DDEAF1]')}
                    onClick={handleRecentChangesClick}
                    type="button"
                >
                    <RefreshCw className="w-3 h-3 text-[#3C6D89]" />
                    <span className="text-[11px]">שינויים אחרונים</span>
                </button>

                <div className="w-px h-4 bg-[#BDC3C7] mx-0.5" />

                {/* Recently used */}
                <button
                    className={cn('flex items-center gap-1.5 px-2 py-1 rounded transition-colors', openPanel === 'recent' ? 'bg-[#D6E7F2]' : 'hover:bg-[#DDEAF1]')}
                    onClick={handleRecentScreensClick}
                    type="button"
                >
                    <Clock className="w-3 h-3 text-[#3C6D89]" />
                    <span className="text-[11px]">בשימוש לאחרונה</span>
                </button>
            </div>

            {/* Left side: Field info & record position */}
            <div className="flex items-center gap-3">
                <button
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#DDEAF1] transition-colors"
                    onClick={handleToggleView}
                    title="החלפת מצב תצוגה"
                    type="button"
                >
                    {viewMode === 'table' ? <Table className="w-3.5 h-3.5 text-[#1A6EA1]" /> : <Layers className="w-3.5 h-3.5 text-[#1A6EA1]" />}
                    <span className="text-[11px]">{viewMode === 'table' ? 'טבלה' : 'טופס'}</span>
                </button>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* Attachments */}
                <button className="p-0.5 hover:bg-[#DDEAF1] rounded transition-colors flex items-center gap-1" onClick={handleAttach} title="צירוף קבצים" type="button">
                    <Paperclip className="w-3.5 h-3.5 text-[#3C6D89]" />
                    <span className="text-[11px]">{attachedFiles.length}</span>
                </button>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* Field label */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7F8C8D]">שדה</span>
                    <span className="text-[11px] font-bold text-[#2C3E50]">{focusedLabel || 'ללא מיקוד'}</span>
                </div>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* Record position */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7F8C8D]">{recordStatus?.label || 'מסכים'}</span>
                    <span className="text-[11px] font-bold">
                        {recordStatus ? `${recordStatus.current} / ${recordStatus.total}` : `${history.length} / ${activeScreens.length || 1}`}
                    </span>
                </div>

                <div className="w-px h-4 bg-[#BDC3C7]" />

                {/* CLICK Hub branding */}
                <button
                    className={cn('text-[10px] font-bold text-[#1A6EA1] tracking-wider px-1.5 py-0.5 rounded', openPanel === 'hub' ? 'bg-[#D6E7F2]' : 'hover:bg-[#DDEAF1]')}
                    onClick={() => setOpenPanel(openPanel === 'hub' ? null : 'hub')}
                    type="button"
                >
                    click hub
                </button>
            </div>

            {openPanel && (
                <div className="fixed bottom-10 right-2 z-[130] w-[350px] max-h-[260px] bg-white border border-[#C8D9E6] shadow-xl rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#E3EDF3] bg-[#F6FAFD]">
                        <span className="text-[12px] font-semibold text-[#1C435F]">
                            {openPanel === 'active' && 'מסכים פעילים'}
                            {openPanel === 'changes' && 'שינויים אחרונים'}
                            {openPanel === 'recent' && 'בשימוש לאחרונה'}
                            {openPanel === 'hub' && 'CLICK Hub'}
                        </span>
                        <button className="p-1 rounded hover:bg-[#E6F0F6]" onClick={() => setOpenPanel(null)}>
                            <X className="w-3 h-3 text-[#557B94]" />
                        </button>
                    </div>

                    <div className="max-h-[210px] overflow-auto p-2">
                        {openPanel === 'active' && (
                            <div className="space-y-1">
                                {activeScreens.map((screen) => (
                                    <button
                                        key={screen.route}
                                        className="w-full text-right px-2 py-1.5 rounded text-[11px] hover:bg-[#EDF5FA] transition-colors"
                                        onClick={() => navigateTo(screen.route)}
                                    >
                                        {screen.label}
                                    </button>
                                ))}
                                {!activeScreens.length && <p className="text-[11px] text-[#6C879A] px-1 py-2">אין מסכים זמינים.</p>}
                            </div>
                        )}

                        {openPanel === 'changes' && (
                            <div className="space-y-1">
                                {statusEntries.map((entry) => (
                                    <div key={entry.id} className="px-2 py-1.5 rounded bg-[#FAFCFD] border border-[#E9F1F6]">
                                        <p className="text-[11px] text-[#1D3D56]">{entry.label}</p>
                                        <p className="text-[10px] text-[#6E8798]">{formatTimestamp(entry.timestamp)}</p>
                                    </div>
                                ))}
                                {!statusEntries.length && <p className="text-[11px] text-[#6C879A] px-1 py-2">עדיין אין שינויים להצגה.</p>}
                            </div>
                        )}

                        {openPanel === 'recent' && (
                            <div className="space-y-1">
                                {recentlyUsedScreens.map((screen) => (
                                    <button
                                        key={screen.route}
                                        className="w-full text-right px-2 py-1.5 rounded text-[11px] hover:bg-[#EDF5FA] transition-colors"
                                        onClick={() => navigateTo(screen.route)}
                                    >
                                        {screen.label}
                                    </button>
                                ))}
                                {!recentlyUsedScreens.length && <p className="text-[11px] text-[#6C879A] px-1 py-2">אין מסכים אחרונים.</p>}
                            </div>
                        )}

                        {openPanel === 'hub' && (
                            <div className="space-y-1">
                                <button className="w-full text-right px-2 py-1.5 rounded text-[11px] hover:bg-[#EDF5FA]" onClick={() => navigateTo('/dashboard')}>
                                    מעבר ללוח הבקרה
                                </button>
                                <button className="w-full text-right px-2 py-1.5 rounded text-[11px] hover:bg-[#EDF5FA]" onClick={() => navigateTo('/dashboard/core')}>
                                    מעבר למסך ליבה
                                </button>
                                <button className="w-full text-right px-2 py-1.5 rounded text-[11px] hover:bg-[#EDF5FA]" onClick={() => navigateTo('/dashboard/core/employees')}>
                                    מעבר לעובדים
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
