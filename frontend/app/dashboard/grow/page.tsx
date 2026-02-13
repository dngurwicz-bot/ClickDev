'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function GrowPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Grow"
        subtitle="ניהול ביצועים והתפתחות: מחזורי הערכה, סקירות מנהל ויעדים עם מעקב התקדמות."
        accent="#14532d"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Review Cycles" value="תכנון" note="לוחות זמנים והנחיות" />
        <MetricCard label="Reviews" value="ביצוע" note="משוב 360 וציון" />
        <MetricCard label="Goals" value="יישור קו" note="יעדים אישיים וצוותיים" />
        <MetricCard label="Coaching" value="שיחות" note="מעקב פעולות המשך" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/dashboard/grow/cycles" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">מחזורי הערכה</p>
          <p className="mt-1 text-xs text-[#6b879b]">יצירת מחזורים לפי תקופה וסטטוס</p>
        </Link>
        <Link href="/dashboard/grow/reviews" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">הערכות עובדים</p>
          <p className="mt-1 text-xs text-[#6b879b]">ניהול תהליך הערכה וציונים</p>
        </Link>
        <Link href="/dashboard/grow/goals" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">יעדים</p>
          <p className="mt-1 text-xs text-[#6b879b]">הגדרה ומדידת התקדמות לאורך השנה</p>
        </Link>
      </div>
    </div>
  )
}
