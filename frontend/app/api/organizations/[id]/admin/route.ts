import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('WARNING: Using Anon Key for Admin route due to missing Service Role Key.')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Next.js 15 (Promise) and older versions
    const resolvedParams = params instanceof Promise ? await params : params
    const orgId = resolvedParams.id

    // Find admin user role
    const { data: userRole, error: roleError } = await supabaseAdmin
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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id)

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
