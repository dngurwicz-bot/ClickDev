'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function VibePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Vibe"
        subtitle="חוויית עובד רציפה: פורטל תוכן, ניהול אירועים וסקרי Pulse בזמן אמת."
        accent="#be123c"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Portal" value="פוסטים" note="לוח מודעות ארגוני" />
        <MetricCard label="Events" value="חגיגות" note="ימי הולדת, ותק, חגים" />
        <MetricCard label="Pulse" value="Engagement" note="מדידת שביעות רצון" />
        <MetricCard label="Retention" value="Culture" note="חיזוק שייכות עובדים" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/dashboard/vibe/portal" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">פורטל עובד</p>
          <p className="mt-1 text-xs text-[#6b879b]">פרסום עדכונים עם אפשרות נעיצה</p>
        </Link>
        <Link href="/dashboard/vibe/events" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">אירועים</p>
          <p className="mt-1 text-xs text-[#6b879b]">ניהול אירועי עובדים ומתנות</p>
        </Link>
        <Link href="/dashboard/vibe/pulse" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">Pulse Surveys</p>
          <p className="mt-1 text-xs text-[#6b879b]">פתיחה/סגירה של סקרים קצרים</p>
        </Link>
      </div>
    </div>
  )
}
