import { createClient } from '@/utils/supabase/server'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export interface LogContext {
  userId?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  [key: string]: any
}

export async function log(
  level: LogLevel,
  message: string,
  context?: LogContext
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('system_logs').insert({
      level,
      message,
      context: context || {},
      user_id: user?.id || context?.userId,
      organization_id: context?.organizationId,
      ip_address: context?.ipAddress,
      user_agent: context?.userAgent
    })
  } catch (error) {
    // Don't throw - logging should never break the app
    console.error('Failed to write log:', error)
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('INFO', message, context),
  warn: (message: string, context?: LogContext) => log('WARN', message, context),
  error: (message: string, context?: LogContext) => log('ERROR', message, context),
  debug: (message: string, context?: LogContext) => log('DEBUG', message, context),
}
