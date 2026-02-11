import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export async function GET(request: NextRequest) {
    try {
        // Get all auth users
        const { data: { users }, error: usersError } = await getSupabase().auth.admin.listUsers()

        if (usersError) {
            console.error('Error fetching users:', usersError)
            return NextResponse.json(
                { error: usersError.message },
                { status: 500 }
            )
        }

        // Get all user roles
        const { data: userRoles, error: rolesError } = await getSupabase()
            .from('user_roles')
            .select('user_id, role, organization_id, organizations(name)')

        if (rolesError) {
            console.error('Error fetching roles:', rolesError)
        }

        // Combine data
        const usersWithRoles = users.map(user => {
            const roleData = userRoles?.find((r: any) => r.user_id === user.id)
            return {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                user_metadata: user.user_metadata,
                role: roleData?.role || 'user',
                organization_id: roleData?.organization_id || null,
                organization_name: (roleData?.organizations as any)?.name || null,
            }
        })

        return NextResponse.json(usersWithRoles)
    } catch (error: any) {
        console.error('Error in GET /api/users:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
