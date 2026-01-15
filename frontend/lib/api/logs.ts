import { createClient } from '@/utils/supabase/server'

export interface SystemLog {
  id: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
  context?: any
  user_id?: string
  organization_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export async function getSystemLogs(filters?: {
  level?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.level && filters.level !== 'all') {
    query = query.eq('level', filters.level)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  } else {
    query = query.limit(1000) // Default limit
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch logs: ${error.message}`)
  }

  return data as SystemLog[]
}

export async function deleteSystemLog(logId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('system_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    throw new Error(`Failed to delete log: ${error.message}`)
  }
}

export async function deleteSystemLogs(level?: string, beforeDate?: Date) {
  const supabase = await createClient()
  
  // First, get the logs to delete
  let query = supabase.from('system_logs').select('id')

  if (level) {
    query = query.eq('level', level)
  }

  if (beforeDate) {
    query = query.lt('created_at', beforeDate.toISOString())
  }

  const { data: logsToDelete, error: selectError } = await query

  if (selectError) {
    throw new Error(`Failed to find logs: ${selectError.message}`)
  }

  if (!logsToDelete || logsToDelete.length === 0) {
    return // Nothing to delete
  }

  // Delete the logs
  const ids = logsToDelete.map(log => log.id)
  const { error } = await supabase
    .from('system_logs')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to delete logs: ${error.message}`)
  }
}
