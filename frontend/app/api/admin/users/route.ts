import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
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

export async function DELETE(request: NextRequest) {
  try {
    // Verify the requesting user is a super admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
    }

    // Get user to delete from request body
    const body = await request.json()
    const { userId, roleId } = body

    if (!userId || !roleId) {
      return NextResponse.json({ error: 'חסרים פרמטרים' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'לא ניתן למחוק את עצמך' }, { status: 400 })
    }

    // Delete user role using admin client
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', roleId)

    if (roleError) {
      console.error('Error deleting role:', roleError)
      return NextResponse.json({ error: 'שגיאה במחיקת תפקיד: ' + roleError.message }, { status: 500 })
    }

    // Update profile to remove super admin status
    await supabaseAdmin
      .from('profiles')
      .update({ is_super_admin: false })
      .eq('id', userId)

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      // Don't fail if profile delete fails - role is already deleted
    }

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('Error deleting auth user:', authError)
      // Don't fail - the user role and profile are already deleted
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: error.message || 'שגיאה לא צפויה' }, { status: 500 })
  }
}
