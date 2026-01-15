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

export async function GET(request: NextRequest) {
  try {
    // Verify the requesting user is a super admin
    const auth = await verifySuperAdmin()
    
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Get all user roles with organizations (using admin client to bypass RLS)
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        *,
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false })

    if (rolesError) {
      return NextResponse.json({ 
        error: `שגיאה בטעינת user_roles: ${rolesError.message}` 
      }, { status: 500 })
    }

    // Get all profiles (using admin client to bypass RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ 
        error: `שגיאה בטעינת profiles: ${profilesError.message}` 
      }, { status: 500 })
    }

    // Create a map of profiles by user_id for quick lookup
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Combine the data
    const usersWithProfiles = userRoles?.map(role => ({
      ...role,
      profile: profilesMap.get(role.user_id) || null
    })) || []

    return NextResponse.json({ 
      success: true,
      users: usersWithProfiles
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'שגיאה בטעינת משתמשים',
    }, { status: 500 })
  }
}
