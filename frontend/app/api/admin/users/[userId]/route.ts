import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify the requesting user is a super admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
    }

    // Check if user is super admin - check user_roles first (more reliable)
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    // Check if any role is super_admin
    const hasSuperAdminRole = userRoles?.some(r => r.role === 'super_admin') || false

    // Also check profile
    const { data: profile, error: profileCheckErr } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle()

    const isSuperAdmin = hasSuperAdminRole || profile?.is_super_admin === true

    if (!isSuperAdmin) {
      console.error('User is not super admin:', {
        userId: user.id,
        email: user.email,
        userRoles: userRoles,
        profileIsSuperAdmin: profile?.is_super_admin,
        rolesError: rolesError?.message,
        profileCheckError: profileCheckErr?.message
      })
      return NextResponse.json({ error: 'אין הרשאה - רק Super Admin יכול לבצע פעולה זו' }, { status: 403 })
    }
    
    const { userId } = await params
    const body = await request.json()
    const { first_name, last_name, role, organization_id, is_super_admin } = body

    if (!userId) {
      return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })
    }

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'שם פרטי ושם משפחה הם שדות חובה' }, { status: 400 })
    }

    // Update profile using admin client (bypasses RLS)
    // full_name will be automatically updated by the trigger
    const { error: profileUpdateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        is_super_admin: is_super_admin || false,
      })
      .eq('id', userId)

    if (profileUpdateErr) {
      return NextResponse.json({ error: `שגיאה בעדכון פרופיל: ${profileUpdateErr.message}` }, { status: 500 })
    }

    // Get existing user role using admin client
    const { data: existingRole, error: roleFetchError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    // Ignore "not found" errors - it's okay if role doesn't exist yet
    if (roleFetchError && roleFetchError.code !== 'PGRST116') {
      console.error('Error fetching user role:', roleFetchError)
    }

    if (role) {
      if (existingRole) {
        // Update existing role using admin client (bypasses RLS)
        const { error: roleUpdateError } = await supabaseAdmin
          .from('user_roles')
          .update({
            role,
            organization_id: role === 'super_admin' ? null : (organization_id || null),
          })
          .eq('id', existingRole.id)

        if (roleUpdateError) {
          return NextResponse.json({ error: `שגיאה בעדכון תפקיד: ${roleUpdateError.message}` }, { status: 500 })
        }
      } else {
        // Create new role if doesn't exist using admin client (bypasses RLS)
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role,
            organization_id: role === 'super_admin' ? null : (organization_id || null),
          })

        if (roleInsertError) {
          return NextResponse.json({ error: `שגיאה ביצירת תפקיד: ${roleInsertError.message}` }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'המשתמש עודכן בהצלחה'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'שגיאה בעדכון המשתמש' }, { status: 500 })
  }
}
