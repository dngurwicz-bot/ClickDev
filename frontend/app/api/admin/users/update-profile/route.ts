import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()
    const { userId, fullName, email } = body

    if (!userId || !fullName) {
      return NextResponse.json({ error: 'חסרים פרטים נדרשים' }, { status: 400 })
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        ...(email && { email }),
      })
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: `שגיאה בעדכון פרופיל: ${profileError.message}` }, { status: 500 })
    }

    // Also update user metadata if possible
    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: fullName,
        }
      })
      if (updateError) {
        console.error('Error updating user metadata:', updateError)
      }
    } catch (metaErr) {
      console.error('Error updating metadata:', metaErr)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'פרופיל עודכן בהצלחה'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
