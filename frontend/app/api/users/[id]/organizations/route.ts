import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const userId = resolvedParams.id

        // Get all user_roles for this user
        const { data, error } = await supabase
            .from('user_roles')
            .select('organization_id, role, is_primary, organizations(id, name)')
            .eq('user_id', userId)

        if (error) {
            console.error('Error fetching user organizations:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        const userOrgs = data.map((row: any) => ({
            organization_id: row.organization_id,
            organization_name: row.organizations?.name || 'Unknown',
            role: row.role,
            is_primary: row.is_primary || false
        }))

        return NextResponse.json(userOrgs)
    } catch (error: any) {
        console.error('Error in GET /api/users/[id]/organizations:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const userId = resolvedParams.id
        const body = await request.json()
        const { organization_id, role, is_primary } = body

        // If setting as primary, unset other primaries first
        if (is_primary) {
            await supabase
                .from('user_roles')
                .update({ is_primary: false })
                .eq('user_id', userId)
        }

        // Add user to organization
        const { data, error } = await supabase
            .from('user_roles')
            .insert({
                user_id: userId,
                organization_id,
                role: role || 'user',
                is_primary: is_primary || false
            })
            .select()

        if (error) {
            console.error('Error adding user to organization:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error in POST /api/users/[id]/organizations:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const userId = resolvedParams.id
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organization_id')

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organization_id is required' },
                { status: 400 }
            )
        }

        // Remove user from organization
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('organization_id', organizationId)

        if (error) {
            console.error('Error removing user from organization:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in DELETE /api/users/[id]/organizations:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
