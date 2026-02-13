'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function VisionPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Vision"
        subtitle="תרשים ארגוני חי עם ניתוח עומסים, זיהוי פערי ניהול וזום למחלקות."
        accent="#4c1d95"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Live Graph" value="Org Chart" note="צפייה בזמן אמת" />
        <MetricCard label="Analysis" value="Gaps" note="חורים ניהוליים וחריגות" />
        <MetricCard label="Zoom" value="מחלקות" note="מיקוד תצוגה לפי יחידה" />
        <MetricCard label="Executive" value="Board Ready" note="מצגת הנהלה" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/dashboard/vision/org-chart" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">Org Chart חי</p>
          <p className="mt-1 text-xs text-[#6b879b]">Nodes/Edges עם תצוגת עומק ארגונית</p>
        </Link>
        <Link href="/dashboard/vision/gap-analysis" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">Gap Analysis</p>
          <p className="mt-1 text-xs text-[#6b879b]">הרצת ניתוח והצגת התראות מתעדפות</p>
        </Link>
      </div>
    </div>
  )
}
