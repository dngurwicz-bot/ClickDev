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
    
    console.log(`[Events API] Received request for event ${eventCode}`)
    console.log(`[Events API] Auth header present: ${!!authHeader}`)
    console.log(`[Events API] Auth header (first 50 chars): ${authHeader?.substring(0, 50)}...`)
    
    if (!authHeader) {
      console.warn('[Events API] Missing authentication header')
      return NextResponse.json(
        { detail: 'Missing authentication header' },
        { status: 401 }
      )
    }

    console.log(`[Events API] Forwarding to ${BACKEND_URL}/api/events/${eventCode}`)

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
    
    console.log(`[Events API] Backend response status: ${backendResponse.status}`)
    console.log(`[Events API] Backend response: ${JSON.stringify(responseData).substring(0, 100)}`)

    if (!backendResponse.ok) {
      console.error(`[Events API] Backend error: ${JSON.stringify(responseData)}`)
      return NextResponse.json(
        responseData,
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('[Events API] Error in events API route:', error)
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
