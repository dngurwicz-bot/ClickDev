'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
        // Fetch user roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)

        const isSuperAdmin = userRoles?.some(r => r.role === 'super_admin')

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
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-20 relative">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              ברוך הבא
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              הזן את פרטי ההתחברות שלך כדי להמשיך
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-red-800">
                    שגיאת התחברות
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  כתובת אימייל
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors pr-3">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 sm:text-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    סיסמה
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    שכחת סיסמה?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors pr-3">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  מתחבר...
                </>
              ) : (
                'התחבר למערכת'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} DNG HUB. כל הזכויות שמורות.
          </div>
        </div>
      </div>

      {/* Left Side - Decoration */}
      <div className="hidden lg:flex lg:flex-1 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay" />

        <div className="relative z-20 flex flex-col justify-between h-full p-20 text-white">
          <div>
            <div className="h-12 w-12 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-8 border border-white/10">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold max-w-md leading-tight mb-6">
              ניהול משאבי אנוש,<br />
              <span className="text-primary">פשוט וחכם.</span>
            </h2>
            <p className="text-slate-300 max-w-sm text-lg leading-relaxed">
              פלטפורמת הניהול המתקדמת של DNG HUB מאפשרת לכם לנהל את העובדים, המחלקות והמשימות במקום אחד.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-3 -space-x-reverse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span>הצטרפו למאות חברות מובילות</span>
          </div>
        </div>
      </div>
    </div>
  )
}
