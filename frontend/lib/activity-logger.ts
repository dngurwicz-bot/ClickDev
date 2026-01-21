import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export async function logActivity(
    userId: string,
    actionType: string,
    entityType: string,
    entityId?: string,
    details: any = {},
    organizationId?: string
) {
    try {
        const { error } = await supabaseAdmin
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
