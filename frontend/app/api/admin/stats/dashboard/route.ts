import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${BACKEND_API_BASE}/api/admin/stats/dashboard`, {
            method: 'GET',
            headers: {
                Authorization: request.headers.get('Authorization') || '',
            },
            cache: 'no-store',
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Error in GET /api/admin/stats/dashboard:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
