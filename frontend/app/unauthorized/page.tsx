import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main" dir="rtl">
      <div className="text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-danger" />
        <h1 className="mt-4 text-3xl font-bold text-text-primary">אין הרשאה</h1>
        <p className="mt-2 text-text-secondary">
          אין לך הרשאה לגשת לדף זה
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-dark"
        >
          חזור להתחברות
        </Link>
      </div>
    </div>
  )
}
