'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Docs"
        subtitle="מכתבים רשמיים ותהליכי חתימה דיגיטלית עם תבניות חכמות ומעקב ביצוע."
        accent="#9a3412"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Templates" value="תבניות" note="Merge fields מאושרים" />
        <MetricCard label="Instances" value="הפקות" note="PDF + גרסאות" />
        <MetricCard label="Signature" value="Envelopes" note="שליחה ומעקב" />
        <MetricCard label="Quality" value="אחידות" note="אותו נוסח לכל הארגון" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/dashboard/docs/templates" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">תבניות מסמך</p>
          <p className="mt-1 text-xs text-[#6b879b]">ניהול placeholders, גוף מסמך וגרסאות</p>
        </Link>
        <Link href="/dashboard/docs/instances" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">מסמכים מופקים</p>
          <p className="mt-1 text-xs text-[#6b879b]">הפקה, סטטוס חתימה וארכוב</p>
        </Link>
      </div>
    </div>
  )
}
