import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params

    // Find admin user role
    const { data: userRole, error: roleError } = await getSupabase()
      .from('user_roles')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'organization_admin')
      .single()

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: 'Organization admin not found' },
        { status: 404 }
      )
    }

    // Get user details
    const { data: { user }, error: userError } = await getSupabase().auth.admin.getUserById(userRole.user_id)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name,
    })
  } catch (error: any) {
    console.error('Error fetching admin user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
