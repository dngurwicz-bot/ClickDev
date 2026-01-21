import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_API_KEY!

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { email } = await request.json()
    // Handle both Next.js 15 (Promise) and older versions
    const resolvedParams = params instanceof Promise ? await params : params
    const orgId = resolvedParams.id

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // 1. Get user by email to find their ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === email)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 2. Verify they belong to this organization
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, organization_id, role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: 'User does not belong to this organization' },
        { status: 403 }
      )
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/update-password`,
      },
    })

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully',
    })
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
