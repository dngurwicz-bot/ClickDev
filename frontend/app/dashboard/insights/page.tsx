'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Insights"
        subtitle="שכבת BI מודולרית: הגדרת KPI, בניית ווידג'טים והרצות דוחות להנהלה."
        accent="#1e40af"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="KPI Catalog" value="מדדים" note="מדיניות חישוב אחידה" />
        <MetricCard label="Dashboards" value="Widgets" note="תצוגה ניהולית בזמן אמת" />
        <MetricCard label="Reports" value="Runs" note="הפקות חתוכות לפי צורך" />
        <MetricCard label="Decisions" value="Actionable" note="תובנות מבוססות נתונים" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/dashboard/insights/kpis" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">KPI Definitions</p>
          <p className="mt-1 text-xs text-[#6b879b]">הגדרת מדדים לפי מודול ונוסחה</p>
        </Link>
        <Link href="/dashboard/insights/dashboards" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">Widgets</p>
          <p className="mt-1 text-xs text-[#6b879b]">תכנון רכיבי דשבורד למנהלים</p>
        </Link>
        <Link href="/dashboard/insights/reports" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">Reports</p>
          <p className="mt-1 text-xs text-[#6b879b]">ניהול הגדרות והרצות דוחות</p>
        </Link>
      </div>
    </div>
  )
}
