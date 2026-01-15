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
    const { email, firstName, lastName, phone, organizationId } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'חסרים פרטים נדרשים' }, { status: 400 })
    }

    // Check if user already exists - try multiple methods
    let existingUser = null
    let userId: string | null = null
    
    // Method 1: Try listUsers
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    } catch (err) {
      console.log('listUsers error:', err)
    }
    
    // Method 2: If not found, check profiles table and get user by ID
    if (!existingUser) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle()
      
      if (profile?.id) {
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id)
          if (user) {
            existingUser = user
          }
        } catch (err) {
          console.log('getUserById error:', err)
        }
      }
    }

    if (existingUser) {
      // User already exists - update metadata to ensure it appears in Dashboard
      userId = existingUser.id
      
      // Update user metadata to ensure it appears in Supabase Dashboard
      try {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
          },
          app_metadata: {
            provider: 'email',
            providers: ['email'],
            ...existingUser.app_metadata
          }
        })
      } catch (updateErr: any) {
        console.error('Error updating user metadata:', updateErr)
        // Continue anyway - profile and role will still be updated
      }
    } else {
      // Create new user using Admin API
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
      const fullName = `${firstName} ${lastName}`.trim()

      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone: phone || '',
        },
        app_metadata: {
          provider: 'email',
          providers: ['email']
        }
      })

      if (createError) {
        return NextResponse.json({ 
          error: `שגיאה ביצירת משתמש: ${createError.message}` 
        }, { status: 500 })
      }

      if (!newUser) {
        return NextResponse.json({ 
          error: 'לא ניתן ליצור משתמש' 
        }, { status: 500 })
      }

      userId = newUser.id
    }

    // Create/update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        is_super_admin: false,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: `שגיאה ביצירת פרופיל: ${profileError.message}` 
      }, { status: 500 })
    }

    // Create user_role if organizationId provided
    if (organizationId) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          role: 'organization_admin',
        }, {
          onConflict: 'user_id,organization_id'
        })

      if (roleError) {
        console.error('Role error:', roleError)
        return NextResponse.json({ 
          error: `שגיאה ביצירת תפקיד: ${roleError.message}` 
        }, { status: 500 })
      }
    }

    // Send password reset email
    let emailSent = false
    let emailError: string | null = null

    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
        }
      })

      if (linkError) {
        emailError = linkError.message
      } else if (linkData) {
        // Link generated - Supabase will send email automatically
        emailSent = true
      }
    } catch (emailErr: any) {
      emailError = emailErr.message || 'שגיאה בשליחת מייל'
    }

    return NextResponse.json({ 
      success: true,
      userId,
      emailSent,
      emailError
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'שגיאה ביצירת משתמש',
    }, { status: 500 })
  }
}
