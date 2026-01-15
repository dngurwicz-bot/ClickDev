import { createClient } from '@/utils/supabase/server'
import { getAllOrganizations } from '@/lib/api/organizations'
import { AnalyticsPageClient } from '@/components/admin/AnalyticsPageClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: organizations } = await getAllOrganizations()

  // Get all employees
  const { data: employees } = await supabase
    .from('employees')
    .select('id, organization_id, created_at, first_name, last_name, email, job_title, department, hire_date')
    .order('created_at', { ascending: false })

  // Get all users with roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role, created_at, user_id')
    .order('created_at', { ascending: false })

  // Get user emails for export
  const userIds = userRoles?.map(ur => ur.user_id).filter(Boolean) || []
  const { data: profiles } = userIds.length > 0 
    ? await supabase.from('profiles').select('id, email').in('id', userIds)
    : { data: [] }

  // Enrich user roles with emails
  const enrichedUserRoles = userRoles?.map(ur => {
    const profile = profiles?.find(p => p.id === ur.user_id)
    return {
      ...ur,
      email: profile?.email || 'N/A'
    }
  }) || []

  return (
    <AnalyticsPageClient
      initialOrganizations={organizations || []}
      initialEmployees={employees || []}
      initialUserRoles={enrichedUserRoles}
    />
  )
}
