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
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      user_metadata: {
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
      },
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: userRoles?.role || 'user',
      organization_id: userRoles?.organization_id || null,
      organization_name: Array.isArray(userRoles?.organizations) ? userRoles.organizations[0]?.name : (userRoles?.organizations as any)?.name || null,
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
    const { first_name, last_name, role, organization_id } = body

    // Map snake_case to camelCase for internal logic if needed, or just use variables directly
    const firstName = first_name
    const lastName = last_name
    const organizationId = organization_id

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

    // 2. Update Role/Organization in Database
    if (role || organizationId !== undefined) {
      const updates: any = { user_id: userId }
      if (role) updates.role = role

      // Handle organization_id: convert empty string to null, allow explicit null
      if (organizationId === '' || organizationId === null) {
        updates.organization_id = null
      } else {
        updates.organization_id = organizationId
      }

      // Use upsert to handle cases where user_role might be missing
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(updates, { onConflict: 'user_id' })

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
      { first_name: firstName, last_name: lastName, role: role, organization_id: organizationId },
      organizationId || 'system' // Use system if no org provided
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
