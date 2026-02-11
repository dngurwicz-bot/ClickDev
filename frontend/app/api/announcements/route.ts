import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// GET - List all announcements (for admin)
export async function GET(request: NextRequest) {
    try {
        const { data, error } = await getSupabase()
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching announcements:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error in GET /api/announcements:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST - Create announcement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { data, error } = await getSupabase()
            .from('announcements')
            .insert(body)
            .select()
            .single()

        if (error) {
            console.error('Error creating announcement:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error in POST /api/announcements:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
