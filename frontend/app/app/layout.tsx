'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Building2, Palette, Shield, Users } from 'lucide-react'

import { getSupabase } from '@/lib/supabase'
import type { MeResponse } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('theme') as any) || 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="h-9 px-3"
    >
      {theme === 'dark' ? 'בהיר' : 'כהה'}
    </Button>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const nav = useMemo(() => {
    const items = []
    items.push({ href: '/app', label: 'בית', icon: Building2 })
    if (me?.is_system_admin) {
      items.push({ href: '/app/admin/orgs', label: 'ארגונים', icon: Users })
      items.push({ href: '/app/admin/brand', label: 'מותג', icon: Palette })
      items.push({ href: '/app/admin/orgs', label: 'סופר אדמין', icon: Shield })
    }
    return items
  }, [me?.is_system_admin])

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      let token: string | undefined
      try {
        const supabase = getSupabase()
        const { data } = await supabase.auth.getSession()
        token = data.session?.access_token
      } catch (e: any) {
        toast.error(e?.message ?? 'שגיאת קונפיגורציה')
        setLoading(false)
        return
      }
      const t = token
      if (!t) {
        router.replace('/login')
        return
      }
      try {
        const res = await apiFetch<MeResponse>('/me', t)
        if (!alive) return
        setMe(res)
      } catch (e: any) {
        if (!alive) return
        toast.error(e?.message ?? 'נכשל לטעון סשן')
        try {
          const supabase = getSupabase()
          await supabase.auth.signOut()
        } catch {}
        router.replace('/login')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [router, pathname])

  async function logout() {
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch {}
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-20 border-b border-brand-text/10 bg-brand-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-brand-text/10 bg-brand-surface">
              <img src="/brand/icon.png" alt="Logo" className="h-full w-full object-contain p-1.5" />
            </div>
            <Logo className="leading-none" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={logout} className="h-9 px-3">
              יציאה
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-brand-text/10 bg-brand-surface p-3">
          <div className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-brand-text/60">Menu</div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
                    active
                      ? 'bg-brand-accent/12 text-brand-text'
                      : 'text-brand-text/80 hover:bg-brand-text/5 hover:text-brand-text',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-brand-text/10 bg-brand-bg/60 p-3 text-xs text-brand-text/70">
            {loading ? 'טוען…' : me?.is_system_admin ? 'סופר אדמין מערכת' : 'משתמש'}
          </div>
        </aside>

        <main className="min-w-0">
          {loading ? (
            <div className="rounded-2xl border border-brand-text/10 bg-brand-surface p-6">טוען…</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
