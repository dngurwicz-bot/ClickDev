'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function AssetsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Assets"
        subtitle="שליטה בציוד IT ובצי רכב: הקצאות, החזרות, ביטוחים, טסטים והתראות."
        accent="#0e7490"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="IT Inventory" value="Assets" note="אחריות ומצב ציוד" />
        <MetricCard label="Fleet" value="Vehicles" note="רכבים ונהגים" />
        <MetricCard label="Compliance" value="תוקפים" note="ביטוח וטסט" />
        <MetricCard label="Traceability" value="History" note="מי קיבל ומתי" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/dashboard/assets/items" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">מלאי ציוד</p>
          <p className="mt-1 text-xs text-[#6b879b]">מחשבים, ציוד היקפי ומצב זמינות</p>
        </Link>
        <Link href="/dashboard/assets/vehicles" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">צי רכב</p>
          <p className="mt-1 text-xs text-[#6b879b]">מעקב רכבים, ביטוחים והקצאות עובדים</p>
        </Link>
      </div>
    </div>
  )
}
