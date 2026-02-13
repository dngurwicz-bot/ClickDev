'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Signed in')
      router.push('/app')
    } catch (err: any) {
      toast.error(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <Card className="w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-xl border border-brand-text/10 bg-brand-surface">
              <img src="/brand/logo.png" alt="Logo" className="h-full w-full object-contain p-1.5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Sign in</div>
              <div className="text-sm text-brand-text/70">Multi-tenant HR SaaS</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
