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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Handle both Next.js 15 (Promise) and older versions
    const resolvedParams = params instanceof Promise ? await params : params
    const orgId = resolvedParams.id

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Delete organization using service role (bypasses RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', orgId)

    if (deleteError) {
      console.error('Error deleting organization:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete organization' },
        { status: 400 }
      )
    }

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
