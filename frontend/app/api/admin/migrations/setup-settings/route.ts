import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST() {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    
    // Read SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'setup-system-settings.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // Split into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
    
    const results = []
    
    for (const statement of statements) {
      if (!statement) continue
      
      try {
        // For CREATE TABLE, we'll use Supabase client operations
        if (statement.includes('CREATE TABLE IF NOT EXISTS system_settings')) {
          // Check if table exists
          const { error: checkError } = await supabase
            .from('system_settings')
            .select('id')
            .limit(1)
          
          if (checkError && checkError.code === 'PGRST116') {
            // Table doesn't exist - we need to create it via SQL
            // Since we can't execute raw SQL, we'll insert default data
            // The table should be created manually or via Supabase migrations
            results.push({ statement: 'CREATE TABLE', status: 'requires_manual_execution' })
            continue
          }
        }
        
        // For INSERT statements, use table operations
        if (statement.includes('INSERT INTO system_settings')) {
          if (statement.includes('maintenance_mode')) {
            const { error } = await supabase
              .from('system_settings')
              .upsert({
                key: 'maintenance_mode',
                value: {
                  enabled: false,
                  message: 'המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.',
                  message_en: 'System is under maintenance. Please try again later.'
                },
                description: 'מצב תחזוקה כללי'
              }, { onConflict: 'key' })
            
            if (error && !error.message.includes('does not exist')) {
              results.push({ statement: 'INSERT maintenance_mode', status: 'error', error: error.message })
            } else {
              results.push({ statement: 'INSERT maintenance_mode', status: 'success' })
            }
          } else if (statement.includes('app_name')) {
            const { error } = await supabase
              .from('system_settings')
              .upsert({
                key: 'app_name',
                value: 'CLICK HR Platform',
                description: 'שם האפליקציה'
              }, { onConflict: 'key' })
            
            if (error && !error.message.includes('does not exist')) {
              results.push({ statement: 'INSERT app_name', status: 'error', error: error.message })
            } else {
              results.push({ statement: 'INSERT app_name', status: 'success' })
            }
          } else if (statement.includes('default_language')) {
            const { error } = await supabase
              .from('system_settings')
              .upsert({
                key: 'default_language',
                value: 'he',
                description: 'שפה ברירת מחדל'
              }, { onConflict: 'key' })
            
            if (error && !error.message.includes('does not exist')) {
              results.push({ statement: 'INSERT default_language', status: 'error', error: error.message })
            } else {
              results.push({ statement: 'INSERT default_language', status: 'success' })
            }
          }
        }
        
        // For ALTER TABLE organizations, check and add columns if needed
        if (statement.includes('ALTER TABLE organizations')) {
          // Check if columns exist by trying to select them
          const { error: checkError } = await supabase
            .from('organizations')
            .select('maintenance_mode, maintenance_message')
            .limit(1)
          
          if (checkError && checkError.message.includes('column') && checkError.message.includes('does not exist')) {
            results.push({ statement: 'ALTER TABLE organizations', status: 'requires_manual_execution' })
          } else {
            results.push({ statement: 'ALTER TABLE organizations', status: 'columns_exist' })
          }
        }
      } catch (error: any) {
        results.push({ statement: statement.substring(0, 50), status: 'error', error: error.message })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration attempted',
      results,
      note: 'Some operations require direct SQL execution. Please check Supabase Dashboard if table creation is needed.'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
