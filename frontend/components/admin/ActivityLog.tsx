import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, UserPlus, PenTool, Trash, AlertCircle } from 'lucide-react'

interface Log {
    id: string
    action_type: string
    entity_type: string
    entity_id: string
    details: any
    created_at: string
}

export default function ActivityLog({ userId }: { userId: string }) {
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const response = await fetch(`/api/activity-logs/${userId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })

                if (response.ok) {
                    const data = await response.json()
                    setLogs(data)
                }
            } catch (error) {
                console.error('Error fetching logs:', error)
            } finally {
                setLoading(false)
            }
        }

        if (userId) fetchLogs()
    }, [userId])

    if (loading) return <div className="p-4 text-center text-gray-500">טוען היסטוריית פעולות...</div>
    if (logs.length === 0) return <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">אין פעולות מתועדות למשתמש זה</div>

    const getIcon = (action: string) => {
        if (action.includes('CREATE') || action.includes('INVITE')) return <UserPlus className="w-4 h-4 text-green-600" />
        if (action.includes('UPDATE')) return <PenTool className="w-4 h-4 text-blue-600" />
        if (action.includes('DELETE')) return <Trash className="w-4 h-4 text-red-600" />
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }

    const formatAction = (log: Log) => {
        const { action_type, details } = log
        if (action_type === 'INVITE_USER') return `הזמין את ${details?.email}`
        if (action_type === 'UPDATE_USER') {
            if (log.entity_id === userId) return 'עדכן את פרטיו האישיים'
            return 'עדכן משתמש'
        }
        if (action_type === 'CREATE_ORGANIZATION') return `יצר ארגון: ${details?.name}`
        if (action_type === 'UPDATE_ORGANIZATION') return `עדכן פרטי ארגון`
        return action_type
    }

    return (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3 relative pb-4 last:pb-0">
                    {/* Line connector */}
                    <div className="absolute top-8 bottom-0 right-[19px] w-0.5 bg-gray-100 last:hidden"></div>

                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center z-10">
                        {getIcon(log.action_type)}
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-900">{formatAction(log)}</h4>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.created_at).toLocaleString('he-IL')}
                            </span>
                        </div>
                        {log.details && (
                            <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <pre className="whitespace-pre-wrap font-sans">
                                    {JSON.stringify(log.details, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
