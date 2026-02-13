'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setConfigError(null)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('התחברת בהצלחה')
      router.push('/app')
    } catch (err: any) {
      const msg = err?.message ?? 'שגיאת התחברות'
      if (typeof msg === 'string' && msg.startsWith('Missing env var:')) setConfigError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <Card className="w-full">
          <div className="flex items-center gap-3">
            <div>
              <Logo />
              <div className="text-sm text-brand-text/70">מערכת משאבי אנוש רב-ארגונית</div>
            </div>
          </div>

          {configError ? (
            <div className="mt-4 rounded-xl border border-brand-text/15 bg-brand-surface p-3 text-sm">
              חסרות הגדרות Supabase ל־Frontend. ודא שיש `frontend/.env.local` עם:
              <div className="mt-2 font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL=...
                <br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=...
              </div>
              ואז הפעל מחדש את ה־Frontend.
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="אימייל"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="סיסמה"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              התחברות
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
