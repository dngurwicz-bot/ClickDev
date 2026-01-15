import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
  }
})

const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixUserMetadata(email) {
  try {
    console.log(`🔍 מחפש משתמש: ${email}...`)
    
    // Use known user ID from SQL query
    const userId = 'f005e8c5-b0e1-4236-abda-971dcaf42023'
    
    // Get user from auth.users by ID
    const { data: { user: targetUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !targetUser) {
      throw new Error(`שגיאה בטעינת משתמש: ${getUserError?.message || 'משתמש לא נמצא'}`)
    }
    
    console.log(`✅ משתמש נמצא: ${targetUser.id}`)
    
    // Get profile to get first_name and last_name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', userId)
      .single()
    
    console.log(`📋 Profile:`, profile)
    
    // Update user metadata to ensure it appears in Supabase Dashboard
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          full_name: profile?.full_name || targetUser.user_metadata?.full_name || email.split('@')[0],
          first_name: profile?.first_name || targetUser.user_metadata?.first_name || '',
          last_name: profile?.last_name || targetUser.user_metadata?.last_name || '',
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          ...targetUser.app_metadata
        }
      }
    )
    
    if (updateError) {
      throw new Error(`שגיאה בעדכון משתמש: ${updateError.message}`)
    }
    
    console.log(`✅ Metadata עודכן בהצלחה!`)
    console.log(`📧 Email: ${email}`)
    console.log(`🆔 User ID: ${targetUser.id}`)
    console.log(`👤 Full Name: ${profile?.full_name || 'N/A'}`)
    
    return updatedUser
  } catch (error) {
    console.error('❌ שגיאה:', error.message)
    process.exit(1)
  }
}

// Run the script
const email = process.argv[2] || 'diego.g@schoolgurwicz.onmicrosoft.com'
fixUserMetadata(email)
