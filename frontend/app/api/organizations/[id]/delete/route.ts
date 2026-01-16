import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials in DELETE /api/organizations/[id]/delete')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `Set (length: ${supabaseServiceKey.length})` : 'Missing')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Validate service key format
    if (supabaseServiceKey.length < 100) {
      console.error('Service role key seems too short:', supabaseServiceKey.length)
      return NextResponse.json(
        { error: 'Server configuration error: Invalid service role key format' },
        { status: 500 }
      )
    }

    // Force Authorization header to ensure service role is used
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`
        }
      }
    })

    // Handle both Next.js 15 (Promise) and older versions
    const resolvedParams = params instanceof Promise ? await params : params
    const orgId = resolvedParams.id
    console.log('Attempting to delete organization:', orgId)

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify existence (and read permissions) first
    const { data: existingOrg, error: findError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single()

    if (findError) {
      console.error('Error finding organization before delete:', JSON.stringify(findError, null, 2))
    } else {
      console.log('Organization found, proceeding to delete:', existingOrg.id)
    }

    // Delete organization using direct REST API to guarantee service role usage
    // This bypasses any client-side RLS or cookie interference from the library
    console.log('Executing raw REST delete for:', orgId)
    const response = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Raw delete failed:', response.status, errorText)
      return NextResponse.json(
        { error: `Database error: ${response.status} ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Raw delete success, deleted rows:', data)

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
