'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import Logo from '@/components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement actual Supabase password reset logic here
    await new Promise(resolve => setTimeout(resolve, 1500)) // Mock delay
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        {!submitted ? (
          <>
            <h1 className="text-2xl font-bold text-text-primary mb-2 text-center">שחזור סיסמה</h1>
            <p className="text-text-secondary mb-8 text-center">
              הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  אימייל
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">בדוק את המייל שלך</h2>
            <p className="text-text-secondary mb-8">
              שלחנו הוראות לאיפוס הסיסמה לכתובת {email}
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  )
}
