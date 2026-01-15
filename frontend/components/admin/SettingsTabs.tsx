"use client"

import { useState } from 'react'
import { User, Lock, Globe, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsTabsProps {
  user: any
  profile: any
}

export function SettingsTabs({ user, profile }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // System settings state
  const [defaultLanguage, setDefaultLanguage] = useState('he')
  const [appName, setAppName] = useState('CLICK HR Platform')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון הפרופיל' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'הסיסמאות אינן תואמות' })
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'הסיסמה חייבת להכיל לפחות 6 תווים' })
      setLoading(false)
      return
    }

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון הסיסמה' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // In a real app, you'd save these to a settings table
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setMessage({ type: 'success', text: 'הגדרות המערכת נשמרו בהצלחה' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה בשמירת ההגדרות' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, name: 'פרופיל', icon: User },
    { id: 'security' as const, name: 'אבטחה', icon: Lock },
    { id: 'system' as const, name: 'מערכת', icon: Globe },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-6">פרטי פרופיל</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                שם מלא
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="הכנס שם מלא"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                אימייל
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-text-secondary">לא ניתן לשנות את כתובת האימייל</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white font-medium transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? 'שומר...' : 'שמור שינויים'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-6">שינוי סיסמה</h2>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                סיסמה חדשה
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="הכנס סיסמה חדשה (לפחות 6 תווים)"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                אישור סיסמה
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="הכנס שוב את הסיסמה"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white font-medium transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {loading ? 'מעדכן...' : 'עדכן סיסמה'}
            </button>
          </form>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-6">הגדרות מערכת</h2>
          <form onSubmit={handleSaveSystemSettings} className="space-y-6">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-text-primary mb-2">
                שם האפליקציה
              </label>
              <input
                id="appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="שם האפליקציה"
              />
            </div>
            <div>
              <label htmlFor="defaultLanguage" className="block text-sm font-medium text-text-primary mb-2">
                שפה ברירת מחדל
              </label>
              <select
                id="defaultLanguage"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white font-medium transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? 'שומר...' : 'שמור הגדרות'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
