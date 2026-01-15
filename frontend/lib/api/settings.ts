import { createClient } from '@/utils/supabase/server'

export interface SystemSettings {
  maintenance_mode: {
    enabled: boolean
    message: string
    message_en?: string
  }
  app_name: string
  default_language: string
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['maintenance_mode', 'app_name', 'default_language'])

  if (error) {
    // Return defaults if table doesn't exist
    return {
      maintenance_mode: {
        enabled: false,
        message: 'המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.',
        message_en: 'System is under maintenance. Please try again later.'
      },
      app_name: 'CLICK HR Platform',
      default_language: 'he'
    }
  }

  const settings: any = {
    maintenance_mode: {
      enabled: false,
      message: 'המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.',
      message_en: 'System is under maintenance. Please try again later.'
    },
    app_name: 'CLICK HR Platform',
    default_language: 'he'
  }

  data?.forEach((item: any) => {
    if (item.key === 'maintenance_mode') {
      settings.maintenance_mode = item.value
    } else if (item.key === 'app_name') {
      settings.app_name = typeof item.value === 'string' ? item.value.replace(/"/g, '') : item.value
    } else if (item.key === 'default_language') {
      settings.default_language = typeof item.value === 'string' ? item.value.replace(/"/g, '') : item.value
    }
  })

  return settings
}

export async function updateSystemSetting(key: string, value: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    })

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`)
  }
}
