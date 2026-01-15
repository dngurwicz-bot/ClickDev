import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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
    console.log('Auth error or no user:', authError?.message)
    return { error: 'לא מחובר', status: 401, supabase: null }
  }

  // Check if user is super admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.log('Profile error:', profileError.message)
    return { error: 'שגיאה בבדיקת הרשאות: ' + profileError.message, status: 500, supabase: null }
  }

  if (!profile?.is_super_admin) {
    console.log('User is not super admin:', user.id)
    return { error: 'אין הרשאה - רק Super Admin יכול לבצע פעולה זו', status: 403, supabase: null }
  }

  return { user, supabase }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifySuperAdmin()
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = auth.supabase!
    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'חסר מזהה ארגון' }, { status: 400 })
    }

    // Get all user IDs associated with this organization before deleting
    const { data: orgUserRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('organization_id', organizationId)

    const orgUserIds = orgUserRoles?.map(ur => ur.user_id) || []

    // Delete related data using admin client to bypass RLS
    // 1. Delete employee_user_mapping (for employees in this org)
    const { data: employees } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('organization_id', organizationId)

    const employeeIds = employees?.map(e => e.id) || []

    if (employeeIds.length > 0) {
      const { error: mappingError } = await supabaseAdmin
        .from('employee_user_mapping')
        .delete()
        .in('employee_id', employeeIds)
      
      if (mappingError) {
        console.log('Error deleting employee_user_mapping:', mappingError.message)
      }
    }

    // 2. Delete employee_history (history of employees in this org)
    const { error: historyError } = await supabaseAdmin
      .from('employee_history')
      .delete()
      .eq('organization_id', organizationId)
    
    if (historyError) {
      console.log('Error deleting employee_history:', historyError.message)
    }

    // 3. Delete employees
    const { error: empError } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('organization_id', organizationId)
    
    if (empError) {
      console.log('Error deleting employees:', empError.message)
    }

    // 4. Delete system_logs for this organization
    const { error: logsError } = await supabaseAdmin
      .from('system_logs')
      .delete()
      .eq('organization_id', organizationId)
    
    if (logsError) {
      console.log('Error deleting system_logs:', logsError.message)
    }

    // 5. Delete user_roles for this organization
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('organization_id', organizationId)
    
    if (rolesError) {
      console.log('Error deleting user roles:', rolesError.message)
    }

    // 6. Delete users from auth.users if they only belong to this organization
    // (only delete if they don't have other roles)
    for (const userId of orgUserIds) {
      // Check if user has other roles
      const { data: otherRoles } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .neq('organization_id', organizationId)

      // If no other roles and not super admin, delete the user
      if (!otherRoles || otherRoles.length === 0) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('is_super_admin')
          .eq('id', userId)
          .single()

        // Don't delete super admins
        if (!profile?.is_super_admin) {
          try {
            // Delete profile first
            await supabaseAdmin
              .from('profiles')
              .delete()
              .eq('id', userId)

            // Delete from auth.users
            await supabaseAdmin.auth.admin.deleteUser(userId)
            console.log(`Deleted user ${userId} (only belonged to deleted organization)`)
          } catch (userDeleteError: any) {
            console.log(`Error deleting user ${userId}:`, userDeleteError.message)
          }
        }
      }
    }

    // 7. Delete the organization
    const { error: orgError } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (orgError) {
      console.error('Error deleting organization:', orgError)
      return NextResponse.json({ error: 'שגיאה במחיקת הארגון: ' + orgError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'הארגון וכל הנתונים הקשורים נמחקו בהצלחה',
      deletedUsers: orgUserIds.length
    })

  } catch (error: any) {
    console.error('Delete organization error:', error)
    return NextResponse.json({ error: error.message || 'שגיאה לא צפויה' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifySuperAdmin()
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = auth.supabase!
    const body = await request.json()
    const { organizationId, status, ...updateData } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'חסר מזהה ארגון' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    if (status) {
      updates.status = status
      updates.is_active = status === 'active'
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return NextResponse.json({ error: 'שגיאה בעדכון הארגון: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update organization error:', error)
    return NextResponse.json({ error: error.message || 'שגיאה לא צפויה' }, { status: 500 })
  }
}
