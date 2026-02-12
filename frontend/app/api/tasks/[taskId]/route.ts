import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params
        const body = await request.text()
        const response = await fetch(`${BACKEND_API_BASE}/api/tasks/${taskId}`, {
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
        console.error('Error in PUT /api/tasks/[taskId]:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params
        const response = await fetch(`${BACKEND_API_BASE}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                Authorization: request.headers.get('Authorization') || '',
            },
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Error in DELETE /api/tasks/[taskId]:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
