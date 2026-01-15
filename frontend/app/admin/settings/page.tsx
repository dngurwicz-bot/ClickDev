import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/admin/SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">הגדרות</h1>
        <p className="mt-2 text-text-secondary">ניהול הגדרות המערכת והפרופיל שלך</p>
      </div>

      <SettingsTabs user={user} profile={profile} />
    </div>
  )
}
