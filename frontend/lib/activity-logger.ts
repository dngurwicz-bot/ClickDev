import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export async function logActivity(
    userId: string,
    actionType: string,
    entityType: string,
    entityId?: string,
    details: any = {},
    organizationId?: string
) {
    try {
        const { error } = await getSupabaseAdmin()
            .from('user_activity_logs')
            .insert({
                user_id: userId,
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId,
                details: details,
                organization_id: organizationId
            })

        if (error) {
            console.error('Error logging activity:', error)
        }
    } catch (error) {
        console.error('Failed to log activity:', error)
    }
}
