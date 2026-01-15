import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()
    const { organizationId, userEmail } = body

    if (!organizationId || !userEmail) {
      return NextResponse.json({ error: 'חסרים פרטים נדרשים' }, { status: 400 })
    }

    // Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ error: `שגיאה בחיפוש משתמש: ${listError.message}` }, { status: 500 })
    }

    const user = users?.find(u => u.email === userEmail)
    
    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא במערכת' }, { status: 404 })
    }

    // Get full name from request body if provided
    const { fullName } = body
    
    // Create/update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: userEmail,
        full_name: fullName || user.user_metadata?.full_name || userEmail.split('@')[0],
        is_super_admin: false,
      })

    if (profileError) {
      return NextResponse.json({ error: `שגיאה ביצירת פרופיל: ${profileError.message}` }, { status: 500 })
    }

    // Create user_role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        organization_id: organizationId,
        role: 'organization_admin',
      }, {
        onConflict: 'user_id,organization_id'
      })

    if (roleError) {
      return NextResponse.json({ error: `שגיאה ביצירת תפקיד: ${roleError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'תפקיד מנהל ארגון נוצר בהצלחה',
      userId: user.id
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
