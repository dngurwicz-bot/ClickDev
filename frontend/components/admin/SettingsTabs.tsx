"use client"

import { useState, useEffect } from 'react'
import { 
  User, 
  Lock, 
  Globe, 
  Save, 
  Key, 
  Database, 
  FileText,
  Mail,
  Shield,
  Activity,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import { SystemLogsTab } from './SystemLogsTab'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface SettingsTabsProps {
  user: any
  profile: any
}

type TabId = 'profile' | 'security' | 'system' | 'api' | 'backup' | 'logs'

export function SettingsTabs({ user, profile }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')

  // Security form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // System settings state
  const [defaultLanguage, setDefaultLanguage] = useState('he')
  const [appName, setAppName] = useState('CLICK HR Platform')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.')
  const [maintenanceMessageEn, setMaintenanceMessageEn] = useState('System is under maintenance. Please try again later.')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.maintenance_mode) {
            setMaintenanceMode(data.maintenance_mode.enabled || false)
            setMaintenanceMessage(data.maintenance_mode.message || 'המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.')
            setMaintenanceMessageEn(data.maintenance_mode.message_en || 'System is under maintenance. Please try again later.')
          }
          if (data.app_name) setAppName(data.app_name)
          if (data.default_language) setDefaultLanguage(data.default_language)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  // API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key: string; created_at: string }>>([])
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Sessions state
  const [sessions, setSessions] = useState<Array<{ id: string; device: string; location: string; last_active: string }>>([
    { id: '1', device: 'Chrome on Windows', location: 'Tel Aviv, IL', last_active: new Date().toISOString() }
  ])

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

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'הסיסמה חייבת להכיל לפחות 8 תווים' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה' })
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
      // Save settings to database
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_mode: {
            enabled: maintenanceMode,
            message: maintenanceMessage,
            message_en: maintenanceMessageEn
          },
          app_name: appName,
          default_language: defaultLanguage
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'שגיאה בשמירת ההגדרות')
      }
      
      setMessage({ type: 'success', text: 'הגדרות המערכת נשמרו בהצלחה' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה בשמירת ההגדרות' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      setMessage({ type: 'error', text: 'אנא הכנס שם למפתח API' })
      return
    }

    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    const newApiKey = {
      id: Math.random().toString(36).substring(7),
      name: newApiKeyName,
      key: newKey,
      created_at: new Date().toISOString()
    }

    setApiKeys([...apiKeys, newApiKey])
    setNewApiKeyName('')
    setShowApiKey({ ...showApiKey, [newApiKey.id]: true })
    setMessage({ type: 'success', text: 'מפתח API נוצר בהצלחה. שמור אותו - הוא לא יוצג שוב!' })
  }

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
    setMessage({ type: 'success', text: 'מפתח API נמחק' })
  }

  const handleCopyApiKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id))
    setMessage({ type: 'success', text: 'סשן בוטל' })
  }

  const tabs: Array<{ id: TabId; name: string; icon: any }> = [
    { id: 'profile', name: 'פרופיל', icon: User },
    { id: 'security', name: 'אבטחה', icon: Lock },
    { id: 'system', name: 'מערכת', icon: Globe },
    { id: 'api', name: 'API & אינטגרציות', icon: Key },
    { id: 'backup', name: 'גיבויים', icon: Database },
    { id: 'logs', name: 'לוגים', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 space-x-reverse min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap
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
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
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
        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-text-primary mb-6">שינוי סיסמה</h2>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                  סיסמה חדשה
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                    placeholder="הכנס סיסמה חדשה (לפחות 8 תווים)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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

          {/* Two-Factor Authentication */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">אימות דו-שלבי</h2>
                <p className="text-sm text-text-secondary mt-1">הוסף שכבת אבטחה נוספת לחשבון שלך</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            {twoFactorEnabled && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">אימות דו-שלבי מופעל. השתמש באפליקציית אימות כדי לאשר התחברויות.</p>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-text-primary mb-6">סשנים פעילים</h2>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">{session.device}</p>
                    <p className="text-sm text-text-secondary">{session.location}</p>
                    <p className="text-xs text-text-muted mt-1">
                      פעיל לאחרונה: {format(new Date(session.last_active), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-text-primary mb-6">הגדרות כלליות</h2>
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
              <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">מצב תחזוקה</p>
                    <p className="text-sm text-text-secondary">הצג הודעת תחזוקה למשתמשים</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                {maintenanceMode && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-text-primary mb-2">
                        הודעת תחזוקה (עברית)
                      </label>
                      <textarea
                        id="maintenanceMessage"
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="הכנס הודעת תחזוקה בעברית"
                      />
                    </div>
                    <div>
                      <label htmlFor="maintenanceMessageEn" className="block text-sm font-medium text-text-primary mb-2">
                        הודעת תחזוקה (אנגלית)
                      </label>
                      <textarea
                        id="maintenanceMessageEn"
                        value={maintenanceMessageEn}
                        onChange={(e) => setMaintenanceMessageEn(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter maintenance message in English"
                      />
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>הערה:</strong> כשמצב התחזוקה פעיל, כל המשתמשים (חוץ מ-Super Admin) יראו את ההודעה הזו ולא יוכלו לגשת למערכת.
                      </p>
                    </div>
                  </div>
                )}
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

          {/* Email Settings */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              הגדרות אימייל (SMTP)
            </h2>
            <form onSubmit={handleSaveSystemSettings} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtpHost" className="block text-sm font-medium text-text-primary mb-2">
                    שרת SMTP
                  </label>
                  <input
                    id="smtpHost"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label htmlFor="smtpPort" className="block text-sm font-medium text-text-primary mb-2">
                    פורט
                  </label>
                  <input
                    id="smtpPort"
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="smtpUser" className="block text-sm font-medium text-text-primary mb-2">
                  שם משתמש
                </label>
                <input
                  id="smtpUser"
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label htmlFor="smtpPassword" className="block text-sm font-medium text-text-primary mb-2">
                  סיסמה
                </label>
                <input
                  id="smtpPassword"
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white font-medium transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {loading ? 'שומר...' : 'שמור הגדרות SMTP'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* API & Integrations Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">מפתחות API</h2>
                <p className="text-sm text-text-secondary mt-1">נהל מפתחות API לגישה למערכת</p>
              </div>
            </div>

            {/* Create New API Key */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  placeholder="שם למפתח API (למשל: Production API)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleCreateApiKey}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                  צור מפתח
                </button>
              </div>
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>אין מפתחות API. צור מפתח חדש כדי להתחיל.</p>
                </div>
              ) : (
                apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-text-primary">{apiKey.name}</p>
                        <p className="text-xs text-text-secondary">
                          נוצר ב-{format(new Date(apiKey.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                        {showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowApiKey({ ...showApiKey, [apiKey.id]: !showApiKey[apiKey.id] })}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {showApiKey[apiKey.id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleCopyApiKey(apiKey.key, apiKey.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedKey === apiKey.id ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
              <Database className="h-5 w-5" />
              גיבויים
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>הערה:</strong> גיבויים אוטומטיים מתבצעים מדי יום בשעה 02:00. ניתן ליצור גיבוי ידני בכל עת.
                </p>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
                  <Download className="h-5 w-5" />
                  צור גיבוי עכשיו
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  <Upload className="h-5 w-5" />
                  שחזר מגיבוי
                </button>
              </div>
            </div>
          </div>

          {/* Backup History */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-text-primary mb-4">היסטוריית גיבויים</h3>
            <div className="space-y-2">
              <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">גיבוי אוטומטי</p>
                  <p className="text-sm text-text-secondary">15/01/2026 02:00</p>
                </div>
                <button className="text-primary hover:text-primary-dark font-medium">הורד</button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">גיבוי אוטומטי</p>
                  <p className="text-sm text-text-secondary">14/01/2026 02:00</p>
                </div>
                <button className="text-primary hover:text-primary-dark font-medium">הורד</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <SystemLogsTab />
      )}
    </div>
  )
}
