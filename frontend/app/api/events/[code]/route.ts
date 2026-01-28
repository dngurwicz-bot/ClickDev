import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  try {
    // Handle both Next.js 15 (Promise) and older versions
    const resolvedParams = params instanceof Promise ? await params : params
    const eventCode = resolvedParams.code

    // Get the request body
    const body = await request.json()

    // Get the authorization header from the client request
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Missing authentication header' },
        { status: 401 }
      )
    }

    // Forward the request to the backend with authentication
    const backendResponse = await fetch(`${BACKEND_URL}/api/events/${eventCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    })

    const responseData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        responseData,
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Error in events API route:', error)
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
