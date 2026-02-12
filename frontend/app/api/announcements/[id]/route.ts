import { NextRequest, NextResponse } from 'next/server'
const BACKEND_API_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'

// PUT - Update announcement
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.text()
        const response = await fetch(`${BACKEND_API_BASE}/api/announcements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: request.headers.get('Authorization') || '',
            },
            body,
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Error in PUT /api/announcements/[id]:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE - Delete announcement
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const response = await fetch(`${BACKEND_API_BASE}/api/announcements/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: request.headers.get('Authorization') || '',
            },
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Error in DELETE /api/announcements/[id]:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
