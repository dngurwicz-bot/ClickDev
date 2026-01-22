import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logActivity } from '@/lib/activity-logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = id

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user role and organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, organization_id, organizations(name)')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      id: user.id,
      email: user.email,
      user_metadata: {
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
      },
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: userRoles?.role || 'user',
      organization_id: userRoles?.organization_id || null,
      organization_name: userRoles?.organizations?.name || null,
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = id
    const body = await request.json()
    const { firstName, lastName, role, organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // CHECK AUTH
    const authHeader = request.headers.get('Authorization')
    let actorId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: u }, error: e } = await supabase.auth.getUser(token)
      if (u) actorId = u.id
    } else {
      // Fallback to cookies
      const cookieStore = await cookies()
      const supabaseSsr = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )
      const { data: { user: u } } = await supabaseSsr.auth.getUser()
      if (u) actorId = u.id
    }

    if (!actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Update Auth Metadata (Name)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { first_name: firstName, last_name: lastName } }
    )

    if (updateError) {
      throw updateError
    }

    // 2. Update Role in Database
    if (role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)

      if (roleError) {
        throw roleError
      }
    }

    // Log Activity
    await logActivity(
      actorId,
      'UPDATE_USER',
      'USER',
      userId,
      { first_name: firstName, last_name: lastName, role: role },
      organizationId
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
