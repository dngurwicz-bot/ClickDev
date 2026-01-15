import { createClient } from '@/utils/supabase/server'

export interface Employee {
  id: string
  organization_id: string
  id_number: string
  first_name: string
  last_name: string
  first_name_en?: string
  last_name_en?: string
  email?: string
  phone?: string
  job_title: string
  department?: string
  salary?: number
  status: string
  manager_id?: string
  hire_date: string
  created_at: string
  updated_at: string
}

export interface EmployeeHistory {
  id: string
  employee_id: string
  organization_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  valid_from: string
  valid_to: string | null
  changed_by: string | null
  change_reason: string | null
  created_at: string
}

export async function getEmployeesByOrg(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      manager:employees!manager_id(first_name, last_name)
    `)
    .eq('organization_id', orgId)
    .order('first_name')
  
  return { data: data as Employee[], error }
}

export async function getEmployeeById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      manager:employees!manager_id(first_name, last_name)
    `)
    .eq('id', id)
    .single()
  
  return { data: data as Employee, error }
}

export async function getEmployeeHistory(employeeId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employee_history')
    .select(`
      *,
      changed_by_user:auth.users!changed_by(email)
    `)
    .eq('employee_id', employeeId)
    .order('valid_from', { ascending: false })
  
  return { data: data as EmployeeHistory[], error }
}
