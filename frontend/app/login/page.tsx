'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F0F4F8]" dir="rtl">
      {/* Card Container */}
      <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] w-full max-w-[600px] p-12 relative overflow-hidden">

        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Header - Logo */}
        <div className="flex justify-start mb-12 relative z-10">
          <div className="flex items-center gap-2">
            <Logo size="lg" />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {/* Username Field */}
          <div className="flex items-center justify-between gap-6">
            <label htmlFor="email" className="w-24 text-sm font-bold text-brand-dark shrink-0">
              שם משתמש
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-10 px-3 py-2 bg-white border border-slate-200 rounded text-right text-slate-800 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
              dir="ltr"
            />
          </div>

          {/* Password Field */}
          <div className="flex items-center justify-between gap-6">
            <label htmlFor="password" className="w-24 text-sm font-bold text-brand-dark shrink-0">
              סיסמה
            </label>
            <div className="relative flex-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded text-right text-slate-800 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-teal hover:bg-teal-700 text-white px-8 py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'כניסה'}
            </button>

            <Link
              href="/forgot-password"
              className="text-brand-teal text-sm hover:underline font-medium"
            >
              שכחת סיסמה?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
