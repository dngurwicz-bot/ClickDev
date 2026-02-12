import { NextRequest, NextResponse } from 'next/server'
const BACKEND_API_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'

// GET - List all announcements (for admin)
export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${BACKEND_API_BASE}/api/announcements`, {
            method: 'GET',
            headers: {
                Authorization: request.headers.get('Authorization') || '',
            },
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
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
        const body = await request.text()
        const response = await fetch(`${BACKEND_API_BASE}/api/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: request.headers.get('Authorization') || '',
            },
            body,
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Error in POST /api/announcements:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
