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

// Verify super admin - exact same logic as organizations route
async function verifySuperAdmin() {
  try {
    const supabase = await getSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[resend-email] Auth error or no user:', authError?.message)
      return { error: 'לא מחובר', status: 401, user: null }
    }

    console.log('[resend-email] User found:', user.id, user.email)

    // Check if user is super admin - use admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('[resend-email] Profile error:', profileError.message, profileError.code)
      // Fallback: check user_roles using admin client
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (rolesError) {
        console.log('[resend-email] Roles error:', rolesError.message)
        return { error: 'שגיאה בבדיקת הרשאות: ' + profileError.message, status: 500, user: null }
      }

      console.log('[resend-email] User roles from fallback:', userRoles)
      const hasSuperAdminRole = userRoles?.some(r => r.role === 'super_admin') || false

      if (!hasSuperAdminRole) {
        return { error: 'שגיאה בבדיקת הרשאות: ' + profileError.message, status: 500, user: null }
      }
      
      console.log('[resend-email] User is super admin (from user_roles fallback)')
    } else {
      console.log('[resend-email] Profile found:', profile)
      if (!profile?.is_super_admin) {
        // Fallback: check user_roles using admin client
        const { data: userRoles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (rolesError) {
          console.log('[resend-email] Roles error:', rolesError.message)
        }

        console.log('[resend-email] User roles from fallback:', userRoles)
        const hasSuperAdminRole = userRoles?.some(r => r.role === 'super_admin') || false

        if (!hasSuperAdminRole) {
          console.log('[resend-email] User is not super admin:', user.id)
          return { error: 'אין הרשאה - רק Super Admin יכול לבצע פעולה זו', status: 403, user: null }
        }
        
        console.log('[resend-email] User is super admin (from user_roles fallback)')
      } else {
        console.log('[resend-email] User is super admin (from profile)')
      }
    }

    return { user, error: null, status: 200 }
  } catch (error: any) {
    console.error('[resend-email] verifySuperAdmin exception:', error)
    return { error: 'שגיאה בבדיקת הרשאות: ' + error.message, status: 500, user: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is a super admin
    const auth = await verifySuperAdmin()
    
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = auth.user!

    const body = await request.json()
    const { userEmail, organizationId, organizationName } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'חסר אימייל' }, { status: 400 })
    }

    // Find user by email - use Admin API to search directly
    let targetUser = null
    
    // Method 1: Search in profiles first to get user ID, then get from auth.users
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .maybeSingle()
    
    if (profile?.id) {
      // User exists in profiles, get from auth.users by ID
      try {
        const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
        if (user && !getUserError) {
          targetUser = user
        }
      } catch (err: any) {
        console.log('getUserById error:', err.message)
      }
    }
    
    // Method 2: If still not found, try listUsers (but this might not find all users)
    if (!targetUser) {
      try {
        // Try to get user by searching through pages
        let page = 1
        let found = false
        while (page <= 10 && !found) { // Search up to 10 pages
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: 50
          })
          
          if (listError || !users || users.length === 0) {
            break
          }
          
          const foundUser = users.find(u => u.email?.toLowerCase() === userEmail.toLowerCase())
          if (foundUser) {
            targetUser = foundUser
            found = true
          } else {
            page++
          }
        }
      } catch (err: any) {
        console.log('listUsers error:', err.message)
      }
    }

    let emailSent = false
    let errorMessage: string | null = null

    // Use Admin API to generate recovery link - Supabase will automatically send the email
    if (targetUser) {
      try {
        // Generate recovery link using Admin API - this will automatically send the email
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: userEmail,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
          }
        })

        if (linkError) {
          errorMessage = linkError.message
          // Check if user doesn't exist
          if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('not registered')) {
            errorMessage = `משתמש עם אימייל ${userEmail} לא קיים במערכת. לא ניתן לשלוח מייל איפוס סיסמה למשתמש שלא קיים.`
          }
        } else if (linkData) {
          // Link generated successfully - Supabase will send the email automatically
          emailSent = true
        }
      } catch (err: any) {
        errorMessage = err.message || 'שגיאה בשליחת מייל'
      }
    } else {
      // User not found - try to send anyway using the email (Supabase will check)
      try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: userEmail,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
          }
        })

        if (linkError) {
          errorMessage = linkError.message
          if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('not registered')) {
            errorMessage = `משתמש עם אימייל ${userEmail} לא קיים במערכת. לא ניתן לשלוח מייל איפוס סיסמה למשתמש שלא קיים.`
          }
        } else if (linkData) {
          emailSent = true
        }
      } catch (err: any) {
        errorMessage = err.message || 'שגיאה בשליחת מייל'
      }
    }

    if (!emailSent) {
      return NextResponse.json({ 
        error: errorMessage || 'לא ניתן לשלוח מייל',
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'מייל נשלח בהצלחה',
      emailSent: true
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'שגיאה בשליחת מייל',
    }, { status: 500 })
  }
}
