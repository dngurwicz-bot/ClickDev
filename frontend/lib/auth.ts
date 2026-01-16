import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole() {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user role:', error)
    return null
  }
  
  return data
}

export async function isSuperAdmin() {
  const role = await getUserRole()
  return role?.role === 'super_admin'
}

export async function requireSuperAdmin() {
  const isSA = await isSuperAdmin()
  if (!isSA) {
    throw new Error('Super admin access required')
  }
}
