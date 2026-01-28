import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SECRET_API_KEY!

    // Verify environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
      console.error('SUPABASE_SECRET_API_KEY:', supabaseKey ? 'Set' : 'Missing')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await request.json()
    const {
      organizationData,
      adminData,
      logoUrl
    } = body

    // Step 1: Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        ...organizationData,
        logo_url: logoUrl || null,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json(
        { error: orgError.message },
        { status: 400 }
      )
    }

    // Step 2: CRITICAL - Create admin user in Supabase Auth
    // This is essential for Supabase to recognize the user and send password reset emails
    console.log('Creating admin user in Supabase Auth:', adminData.email)

    const { data: adminUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: Math.random().toString(36).slice(-12) + 'A1!', // Temporary password
      email_confirm: false, // User will confirm via email link
      user_metadata: {
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        organization_id: org.id,
      },
    })

    if (userError) {
      console.error('Error creating admin user in Supabase Auth:', userError)
      // Rollback: delete organization if user creation fails
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)

      // Translate common errors
      let errorMessage = userError.message || 'Failed to create admin user'
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'האימייל כבר קיים במערכת. המשתמש כבר רשום ב-Supabase Auth.'
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!adminUser || !adminUser.user) {
      console.error('Admin user creation returned no user data')
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: 'Failed to create admin user in Supabase Auth: No user data returned' },
        { status: 400 }
      )
    }

    console.log('Admin user created in Supabase Auth successfully:', adminUser.user.id)

    // Step 3: Create user_role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: adminUser.user.id,
        organization_id: org.id,
        role: 'organization_admin',
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      // Rollback: delete user and organization
      await supabaseAdmin.auth.admin.deleteUser(adminUser.user.id)
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: roleError.message },
        { status: 400 }
      )
    }

    // Step 4: Send password reset email (invitation)
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminData.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/set-password`,
      },
    })

    // Email sending is not critical - log but don't fail
    if (emailError) {
      console.warn('Failed to send invitation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Organization created and admin user added to Supabase Auth',
      organization: org,
      adminUser: {
        id: adminUser.user.id,
        email: adminUser.user.email,
        created_in_auth: true, // Confirm user was created in Supabase Auth
      },
    })
  } catch (error: any) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
