'use client'

import React from 'react'
import Link from 'next/link'
import type { ShortcutGroup } from '@/lib/types/models'

interface ShortcutGroupsPanelProps {
    groups: ShortcutGroup[]
    onCreateGroup: (name: string) => Promise<void>
    onCreateShortcut: (groupId: string, label: string, route: string) => Promise<void>
}

export function ShortcutGroupsPanel({ groups, onCreateGroup, onCreateShortcut }: ShortcutGroupsPanelProps) {
    const [groupName, setGroupName] = React.useState('')
    const [shortcutLabel, setShortcutLabel] = React.useState('')
    const [shortcutRoute, setShortcutRoute] = React.useState('')
    const [targetGroupId, setTargetGroupId] = React.useState('')

    React.useEffect(() => {
        if (!targetGroupId && groups[0]?.id) {
            setTargetGroupId(groups[0].id)
        }
    }, [groups, targetGroupId])

    return (
        <div className="rounded-md border border-[#d5e2ea] bg-white p-4 shadow-sm" dir="rtl">
            <h3 className="mb-3 text-sm font-bold text-[#1f4964]">קיצורי דרך</h3>

            <div className="mb-4 flex flex-wrap items-end gap-2">
                <div>
                    <label className="mb-1 block text-[11px] text-[#688399]">קבוצה חדשה</label>
                    <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="h-8 rounded border border-[#c8dbe7] px-2 text-xs"
                        placeholder="שם קבוצה"
                    />
                </div>
                <button
                    onClick={async () => {
                        if (!groupName.trim()) return
                        await onCreateGroup(groupName.trim())
                        setGroupName('')
                    }}
                    className="h-8 rounded bg-[#2b7aaa] px-3 text-xs font-semibold text-white"
                >
                    הוסף קבוצה
                </button>
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-4">
                <input
                    value={shortcutLabel}
                    onChange={(e) => setShortcutLabel(e.target.value)}
                    className="h-8 rounded border border-[#c8dbe7] px-2 text-xs"
                    placeholder="שם קיצור"
                />
                <input
                    value={shortcutRoute}
                    onChange={(e) => setShortcutRoute(e.target.value)}
                    className="h-8 rounded border border-[#c8dbe7] px-2 text-xs"
                    placeholder="/dashboard/core/employees"
                />
                <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="h-8 rounded border border-[#c8dbe7] px-2 text-xs"
                >
                    {groups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                </select>
                <button
                    onClick={async () => {
                        if (!targetGroupId || !shortcutLabel.trim() || !shortcutRoute.trim()) return
                        await onCreateShortcut(targetGroupId, shortcutLabel.trim(), shortcutRoute.trim())
                        setShortcutLabel('')
                        setShortcutRoute('')
                    }}
                    className="h-8 rounded bg-[#1f4964] px-3 text-xs font-semibold text-white"
                >
                    הוסף קיצור
                </button>
            </div>

            <div className="space-y-3">
                {groups.map((group) => (
                    <div key={group.id} className="rounded border border-[#e2eef5] p-2">
                        <div className="mb-2 text-xs font-semibold text-[#1f4964]">{group.name}</div>
                        <div className="flex flex-wrap gap-2">
                            {(group.shortcuts || []).map((shortcut) => (
                                <Link
                                    key={shortcut.id}
                                    href={shortcut.route}
                                    className="rounded border border-[#c8dbe7] bg-[#f8fbfd] px-2 py-1 text-xs text-[#2b4f65] hover:bg-[#eef6fb]"
                                >
                                    {shortcut.label}
                                </Link>
                            ))}
                            {(group.shortcuts || []).length === 0 && (
                                <span className="text-xs text-[#688399]">אין קיצורים בקבוצה זו.</span>
                            )}
                        </div>
                    </div>
                ))}
                {groups.length === 0 && <p className="text-xs text-[#688399]">אין קבוצות קיצורים. הוסף קבוצה חדשה.</p>}
            </div>
        </div>
    )
}
