import { createClient } from '@/utils/supabase/server'

export interface Organization {
  id: string
  name: string
  name_en?: string
  email: string
  phone?: string
  logo_url?: string
  address?: string
  active_modules: string[]
  subscription_tier: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export async function getAllOrganizations() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Get employee counts separately
  if (data) {
    const orgsWithCounts = await Promise.all(
      data.map(async (org) => {
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
        
        return {
          ...org,
          employee_count: [{ count: count || 0 }]
        }
      })
    )
    
    return { data: orgsWithCounts as Organization[], error }
  }
  
  return { data: data as Organization[], error }
}

export async function getOrganizationById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      employee_count:employees(count)
    `)
    .eq('id', id)
    .single()
  
  return { data: data as Organization, error }
}

export async function createOrganization(orgData: Partial<Organization>) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      ...orgData,
      created_by: user.data.user?.id,
    })
    .select()
    .single()
  
  return { data: data as Organization, error }
}

export async function updateOrganization(id: string, updates: Partial<Organization>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data: data as Organization, error }
}

export async function deleteOrganization(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id)
  
  return { error }
}
