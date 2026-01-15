import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Create authenticated client using cookies
async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in API routes
          }
        },
      },
    }
  )
}

// Verify super admin
async function verifySuperAdmin() {
  const supabase = await getSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'לא מחובר', status: 401, user: null }
  }

  // Check if user is super admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    // Also check user_roles as fallback
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const hasSuperAdminRole = userRoles?.some(r => r.role === 'super_admin') || false

    if (!hasSuperAdminRole) {
      return { error: 'שגיאה בבדיקת הרשאות: ' + profileError.message, status: 500, user: null }
    }
  } else {
    if (!profile?.is_super_admin) {
      // Also check user_roles as fallback
      const { data: userRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const hasSuperAdminRole = userRoles?.some(r => r.role === 'super_admin') || false

      if (!hasSuperAdminRole) {
        return { error: 'אין הרשאה - רק Super Admin יכול לבצע פעולה זו', status: 403, user: null }
      }
    }
  }

  return { user, error: null, status: 200 }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is a super admin
    const auth = await verifySuperAdmin()
    
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'חסר אימייל' }, { status: 400 })
    }

    // Find user by email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase())

    if (!targetUser) {
      return NextResponse.json({ 
        error: `משתמש עם אימייל ${userEmail} לא נמצא` 
      }, { status: 404 })
    }

    // Get profile to get first_name and last_name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', targetUser.id)
      .single()

    // Update user metadata to ensure it appears in Supabase Dashboard
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          full_name: profile?.full_name || targetUser.user_metadata?.full_name || userEmail.split('@')[0],
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
      return NextResponse.json({ 
        error: `שגיאה בעדכון משתמש: ${updateError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Metadata עודכן בהצלחה',
      userId: targetUser.id
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'שגיאה בעדכון metadata',
    }, { status: 500 })
  }
}
