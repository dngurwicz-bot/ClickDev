'use client'

import Link from 'next/link'
import { MetricCard } from '@/components/modules/MetricCard'
import { ModuleHero } from '@/components/modules/ModuleHero'

export default function FlowPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6" dir="rtl">
      <ModuleHero
        title="CLICK Flow"
        subtitle="מרכז תפעול גיוס וקליטה: מצינור מועמדים, דרך משימות onboarding ועד חוזה חתום."
        accent="#0f766e"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Pipeline" value="מועמדים" note="ניהול שלבים והמרה" />
        <MetricCard label="Onboarding" value="משימות" note="SLA והשלמות" />
        <MetricCard label="Contracts" value="חתימות" note="מעקב Draft/Sent/Signed" />
        <MetricCard label="Focus" value="זמן לקליטה" note="צמצום צווארי בקבוק" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/dashboard/flow/candidates" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">מועמדים</p>
          <p className="mt-1 text-xs text-[#6b879b]">פתיחת מועמד, שינוי שלב וחיפוש מהיר</p>
        </Link>
        <Link href="/dashboard/flow/onboarding" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">Onboarding</p>
          <p className="mt-1 text-xs text-[#6b879b]">מסלול קליטה לפי סטטוס ותאריכי יעד</p>
        </Link>
        <Link href="/dashboard/flow/contracts" className="rounded-xl border border-[#c8dbe7] bg-white p-4 shadow-sm hover:bg-[#f8fcff]">
          <p className="text-sm font-bold text-[#1f3f56]">חוזים וחתימות</p>
          <p className="mt-1 text-xs text-[#6b879b]">ניהול מסמכי העסקה ומעקב חתימה</p>
        </Link>
      </div>
    </div>
  )
}
