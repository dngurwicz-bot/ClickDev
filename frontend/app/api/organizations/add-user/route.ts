import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, userData } = body

    if (!organizationId || !userData.email || !userData.firstName || !userData.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // SECURITY CHECK: Verify user permissions
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is the creator of the organization (for initial setup)
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('created_by')
      .eq('id', organizationId)
      .single()

    let isAuthorized = false

    if (!orgError && org && org.created_by === user.id) {
      isAuthorized = true
    } else {
      // Check if user is an admin of the organization
      const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('role', 'organization_admin')
        .single()

      if (userRole) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Permission denied: You must be an organization admin or the creator to add users.' },
        { status: 403 }
      )
    }

    // CRITICAL: Invite user via Supabase Auth
    // This creates the user AND sends the invitation email automatically
    console.log('Inviting user via Supabase Auth:', userData.email)

    // Note: inviteUserByEmail automatically creates the user if they don't exist
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.inviteUserByEmail(userData.email, {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        organization_id: organizationId,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/update-password`,
    })

    if (userError) {
      console.error('Error inviting user in Supabase Auth:', userError)
      let errorMessage = userError.message
      if (errorMessage.includes('already registered')) {
        errorMessage = 'האימייל כבר קיים במערכת. המשתמש כבר רשום.'
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!authUser || !authUser.user) {
      console.error('User invitation returned no user data')
      return NextResponse.json(
        { error: 'Failed to invite user: No user data returned' },
        { status: 400 }
      )
    }

    console.log('User invited successfully:', authUser.user.id)

    // Step 2: Create user_role in our database
    // This links the Supabase Auth user to the organization
    // Note: We check if role exists first to avoid duplicates if re-inviting
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', authUser.user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!existingRole) {
      console.log('Creating user_role in database for user:', authUser.user.id)
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          organization_id: organizationId,
          role: userData.role || 'manager',
        })

      if (roleError) {
        console.error('Error creating user_role:', roleError)
        // We don't rollback the invite (user exists now), but we report the error
        return NextResponse.json(
          { error: roleError.message },
          { status: 400 }
        )
      }
    } else {
      console.log('User role already exists, skipping creation')
    }

    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        created_in_auth: true,
      },
    })
  } catch (error: any) {
    console.error('Error adding user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
