import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'app_name', 'default_language'])

    if (error && !error.message.includes('does not exist')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
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

    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()

    // Update maintenance_mode
    if (body.maintenance_mode) {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'maintenance_mode',
          value: body.maintenance_mode,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        return NextResponse.json({ error: `Failed to update maintenance_mode: ${error.message}` }, { status: 500 })
      }
    }

    // Update app_name
    if (body.app_name !== undefined) {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'app_name',
          value: body.app_name,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        return NextResponse.json({ error: `Failed to update app_name: ${error.message}` }, { status: 500 })
      }
    }

    // Update default_language
    if (body.default_language !== undefined) {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'default_language',
          value: body.default_language,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        return NextResponse.json({ error: `Failed to update default_language: ${error.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
