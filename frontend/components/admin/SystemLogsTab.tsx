"use client"

import { useState, useEffect } from 'react'
import { FileText, Trash2, Download, RefreshCw, X } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
// @ts-ignore
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/client'

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

export function SystemLogsTab() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const loadLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (filterLevel !== 'all') {
        query = query.eq('level', filterLevel)
      }

      if (filterDate) {
        const date = new Date(filterDate)
        const startDate = new Date(date.setHours(0, 0, 0, 0))
        const endDate = new Date(date.setHours(23, 59, 59, 999))
        query = query.gte('created_at', startDate.toISOString())
        query = query.lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה בטעינת הלוגים' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filterLevel, filterDate])

  const handleDeleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .eq('id', logId)

      if (error) throw error

      setLogs(logs.filter(log => log.id !== logId))
      setMessage({ type: 'success', text: 'לוג נמחק בהצלחה' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה במחיקת הלוג' })
    }
  }

  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedLogs)
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .in('id', ids)

      if (error) throw error

      setLogs(logs.filter(log => !selectedLogs.has(log.id)))
      setSelectedLogs(new Set())
      setMessage({ type: 'success', text: 'הלוגים נמחקו בהצלחה' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה במחיקת הלוגים' })
    }
  }

  const handleDeleteOldLogs = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל הלוגים הישנים (לפני 30 יום)?')) {
      return
    }

    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get old logs
      const { data: oldLogs, error: selectError } = await supabase
        .from('system_logs')
        .select('id')
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (selectError) throw selectError

      if (oldLogs && oldLogs.length > 0) {
        const ids = oldLogs.map(log => log.id)
        const { error: deleteError } = await supabase
          .from('system_logs')
          .delete()
          .in('id', ids)

        if (deleteError) throw deleteError
      }

      await loadLogs()
      setMessage({ type: 'success', text: 'לוגים ישנים נמחקו בהצלחה' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'שגיאה במחיקת הלוגים' })
    }
  }

  const handleExport = () => {
    const exportData = logs.map(log => ({
      'תאריך ושעה': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: he }),
      'רמה': log.level,
      'הודעה': log.message,
      'משתמש': log.user_id || 'N/A',
      'ארגון': log.organization_id || 'N/A',
      'כתובת IP': log.ip_address || 'N/A',
      'פרטים נוספים': JSON.stringify(log.context || {})
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'לוגי מערכת')
    XLSX.writeFile(workbook, `system-logs-${new Date().toISOString().split('T')[0]}.xlsx`)
    setMessage({ type: 'success', text: 'הלוגים יוצאו בהצלחה' })
  }

  const toggleLogSelection = (logId: string) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(logId)) {
      newSelected.delete(logId)
    } else {
      newSelected.add(logId)
    }
    setSelectedLogs(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(logs.map(log => log.id)))
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400'
      case 'WARN':
        return 'text-yellow-400'
      case 'INFO':
        return 'text-green-400'
      case 'DEBUG':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            לוגי מערכת
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/logs/setup', { method: 'POST' })
                  const data = await res.json()
                  if (data.success) {
                    setMessage({ type: 'success', text: 'לוגים לדוגמה נוצרו בהצלחה' })
                    await loadLogs()
                  } else {
                    setMessage({ type: 'error', text: data.error || 'שגיאה ביצירת לוגים' })
                  }
                } catch (error: any) {
                  setMessage({ type: 'error', text: error.message || 'שגיאה ביצירת לוגים' })
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              צור לוגים לדוגמה
            </button>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              רענן
            </button>
            <button
              onClick={handleExport}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              ייצא לאקסל
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 rounded-lg p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">כל הלוגים</option>
            <option value="ERROR">שגיאות</option>
            <option value="WARN">אזהרות</option>
            <option value="INFO">מידע</option>
            <option value="DEBUG">דיבוג</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              נקה תאריך
            </button>
          )}
          {selectedLogs.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              מחק נבחרים ({selectedLogs.size})
            </button>
          )}
          <button
            onClick={handleDeleteOldLogs}
            className="ml-auto px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            מחק לוגים ישנים (30+ יום)
          </button>
        </div>

        {/* Logs Display */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">טוען לוגים...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">אין לוגים לתצוגה</div>
              {message?.type === 'error' && message.text.includes('does not exist') && (
                <div className="text-yellow-400 text-xs max-w-md mx-auto bg-yellow-900/20 p-4 rounded border border-yellow-800">
                  <p className="mb-2">טבלת system_logs לא קיימת במסד הנתונים.</p>
                  <p>אנא הרץ את המיגרציה:</p>
                  <code className="block mt-2 p-2 bg-gray-800 rounded text-xs">
                    CREATE TABLE system_logs (...)
                  </code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="mb-2 pb-2 border-b border-gray-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLogs.size === logs.length && logs.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                />
                <span className="text-gray-500 text-xs">בחר הכל</span>
              </div>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 hover:bg-gray-800/50 px-2 py-1 rounded group"
                >
                  <input
                    type="checkbox"
                    checked={selectedLogs.has(log.id)}
                    onChange={() => toggleLogSelection(log.id)}
                    className="mt-1 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-500">
                      [{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: he })}]
                    </span>
                    <span className={`ml-2 ${getLogColor(log.level)}`}>
                      {log.level}:
                    </span>
                    <span className="ml-2">{log.message}</span>
                    {log.context && Object.keys(log.context).length > 0 && (
                      <span className="ml-2 text-gray-500 text-xs">
                        {JSON.stringify(log.context)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {logs.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm text-text-secondary">
            <span>סה"כ: {logs.length} לוגים</span>
            <span>שגיאות: {logs.filter(l => l.level === 'ERROR').length}</span>
            <span>אזהרות: {logs.filter(l => l.level === 'WARN').length}</span>
            <span>מידע: {logs.filter(l => l.level === 'INFO').length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
