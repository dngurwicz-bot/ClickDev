'use client'

import React from 'react'

interface HomeWidgetsPanelProps {
    widgets: Record<string, unknown>
    counters: { employees: number; org_units: number; positions: number }
    onChange: (widgets: Record<string, unknown>) => void
}

export function HomeWidgetsPanel({ widgets, counters, onChange }: HomeWidgetsPanelProps) {
    const showTodo = widgets.showTodo !== false
    const showCounters = widgets.showCounters !== false

    return (
        <div className="rounded-md border border-[#d5e2ea] bg-white p-4 shadow-sm" dir="rtl">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1f4964]">ווידג'טים</h3>
                <div className="flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={showTodo}
                            onChange={(e) => onChange({ ...widgets, showTodo: e.target.checked })}
                        />
                        משימות
                    </label>
                    <label className="inline-flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={showCounters}
                            onChange={(e) => onChange({ ...widgets, showCounters: e.target.checked })}
                        />
                        מונים
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {showTodo && (
                    <div className="rounded border border-[#e2eef5] bg-[#f8fbfd] p-3">
                        <div className="text-xs font-semibold text-[#1f4964]">To Do List</div>
                        <div className="mt-2 text-xs text-[#5f7a8f]">אין משימות פתוחות.</div>
                    </div>
                )}

                {showCounters && (
                    <div className="rounded border border-[#e2eef5] bg-[#f8fbfd] p-3">
                        <div className="text-xs font-semibold text-[#1f4964]">סיכום ארגוני</div>
                        <div className="mt-2 space-y-1 text-xs text-[#2b4f65]">
                            <div>עובדים: {counters.employees}</div>
                            <div>יחידות ארגוניות: {counters.org_units}</div>
                            <div>משרות: {counters.positions}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
