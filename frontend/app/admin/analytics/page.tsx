import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">אנליטיקה</h1>
        <p className="mt-2 text-text-secondary">ניתוח נתונים וסטטיסטיקות</p>
      </div>

      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <BarChart3 className="mx-auto h-16 w-16 text-text-muted" />
        <p className="mt-4 text-text-secondary">דף אנליטיקה יפותח בקרוב</p>
      </div>
    </div>
  )
}
