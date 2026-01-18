import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRoles() {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_roles')
    .select('role, organization_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching user roles:', JSON.stringify(error, null, 2))
    return []
  }

  return data
}

export async function isSuperAdmin() {
  const roles = await getUserRoles()
  return roles.some(r => r.role === 'super_admin')
}

export async function requireSuperAdmin() {
  const isSA = await isSuperAdmin()
  if (!isSA) {
    throw new Error('Super admin access required')
  }
}
