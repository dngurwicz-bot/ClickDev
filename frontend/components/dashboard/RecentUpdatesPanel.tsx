'use client'

interface RecentUpdateItem {
    id: string
    title: string
    subtitle: string
    created_at: string
    route: string
}

interface RecentUpdatesPanelProps {
    items: RecentUpdateItem[]
}

export function RecentUpdatesPanel({ items }: RecentUpdatesPanelProps) {
    return (
        <div className="rounded-md border border-[#d5e2ea] bg-white p-4 shadow-sm" dir="rtl">
            <h3 className="mb-3 text-sm font-bold text-[#1f4964]">שינויים אחרונים</h3>
            <div className="space-y-2">
                {items.slice(0, 8).map((item) => (
                    <a
                        key={item.id}
                        href={item.route}
                        className="block rounded border border-[#e2eef5] px-3 py-2 text-xs text-[#2b4f65] hover:bg-[#f4fafe]"
                    >
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-[#688399]">{item.subtitle}</div>
                    </a>
                ))}
                {items.length === 0 && <p className="text-xs text-[#688399]">אין שינויים להצגה.</p>}
            </div>
        </div>
    )
}
