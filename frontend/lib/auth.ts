import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'super_admin' | 'organization_admin' | 'manager' | 'employee'

export interface UserRoleData {
  role: UserRole
  organization_id: string | null
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(): Promise<UserRoleData | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  console.log('[AUTH] getUserRole - user:', user?.id, user?.email)
  
  if (!user) {
    console.log('[AUTH] getUserRole - no user found')
    return null
  }
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  console.log('[AUTH] getUserRole - data:', data, 'error:', error)
  
  return data as UserRoleData | null
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role?.role === 'super_admin'
}

export async function requireSuperAdmin() {
  const isSA = await isSuperAdmin()
  if (!isSA) {
    redirect('/unauthorized')
  }
}

export async function getUserOrganizations() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data } = await supabase
    .from('user_roles')
    .select('organization_id, role')
    .eq('user_id', user.id)
  
  return data || []
}
