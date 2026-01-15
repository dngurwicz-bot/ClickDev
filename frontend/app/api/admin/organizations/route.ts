import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    // Delete related data first (RLS policies should allow this for Super Admin)
    // Delete employees
    const { error: empError } = await supabase
      .from('employees')
      .delete()
      .eq('organization_id', organizationId)
    
    if (empError) {
      console.log('Error deleting employees:', empError.message)
    }

    // Delete user roles for this organization
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('organization_id', organizationId)
    
    if (rolesError) {
      console.log('Error deleting user roles:', rolesError.message)
    }

    // Delete the organization
    const { error: orgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (orgError) {
      console.error('Error deleting organization:', orgError)
      return NextResponse.json({ error: 'שגיאה במחיקת הארגון: ' + orgError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

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
