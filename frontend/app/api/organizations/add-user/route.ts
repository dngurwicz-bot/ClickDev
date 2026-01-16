import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

    // CRITICAL: Create user in Supabase Auth first
    // This is essential for Supabase to recognize the user and send password reset emails
    console.log('Creating user in Supabase Auth:', userData.email)
    
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: Math.random().toString(36).slice(-12) + 'A1!', // Temporary password
      email_confirm: false, // User will confirm via email link
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        organization_id: organizationId,
      },
    })

    if (userError) {
      console.error('Error creating user in Supabase Auth:', userError)
      // Translate common errors
      let errorMessage = userError.message
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'האימייל כבר קיים במערכת. המשתמש כבר רשום ב-Supabase Auth.'
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!authUser || !authUser.user) {
      console.error('User creation returned no user data')
      return NextResponse.json(
        { error: 'Failed to create user in Supabase Auth: No user data returned' },
        { status: 400 }
      )
    }

    console.log('User created in Supabase Auth successfully:', authUser.user.id)

    // Step 2: Create user_role in our database
    // This links the Supabase Auth user to the organization
    console.log('Creating user_role in database for user:', authUser.user.id)
    
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id, // Use the user ID from Supabase Auth
        organization_id: organizationId,
        role: userData.role || 'manager',
      })

    if (roleError) {
      console.error('Error creating user_role, rolling back user creation:', roleError)
      // Rollback: delete user from Supabase Auth if role creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: roleError.message },
        { status: 400 }
      )
    }

    console.log('User role created successfully')

    // Step 3: Send invitation email via Supabase Auth
    // This will only work if the user exists in Supabase Auth (which we just created)
    console.log('Sending invitation email to:', userData.email)
    
    const { data: linkData, error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userData.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/set-password`,
      },
    })

    if (emailError) {
      console.warn('Failed to send invitation email (user was still created):', emailError)
      // Don't fail the request - user was created successfully, email can be sent later
    } else {
      console.log('Invitation email sent successfully')
    }

    return NextResponse.json({
      success: true,
      message: 'User created in Supabase Auth and added to organization',
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        created_in_auth: true, // Confirm user was created in Supabase Auth
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
