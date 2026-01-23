'use client'

import { X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface CriticalAnnouncementModalProps {
    announcement: {
        id: string
        title: string
        content: string
        type: string
        created_at: string
    }
    onClose: () => void
    onDismiss: () => void
}

export default function CriticalAnnouncementModal({
    announcement,
    onClose,
    onDismiss
}: CriticalAnnouncementModalProps) {
    const [loading, setLoading] = useState(false)

    const handleMarkAsRead = async (dismiss: boolean = false) => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('announcement_reads')
                .upsert({
                    user_id: user.id,
                    announcement_id: announcement.id,
                    dismissed: dismiss,
                    read_at: new Date().toISOString()
                })

            if (error) {
                console.error('Error marking announcement as read:', error)
                toast.error('שגיאה בשמירת הסטטוס')
                return
            }

            if (dismiss) {
                onDismiss()
            } else {
                onClose()
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('שגיאה')
        } finally {
            setLoading(false)
        }
    }

    const getTypeColor = () => {
        switch (announcement.type) {
            case 'warning': return 'bg-yellow-50 border-yellow-200'
            case 'success': return 'bg-green-50 border-green-200'
            case 'update': return 'bg-purple-50 border-purple-200'
            default: return 'bg-red-50 border-red-200'
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleMarkAsRead(false)}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Alert Icon */}
                <div className={`p-6 border-b-4 ${getTypeColor()}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {announcement.title}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {new Date(announcement.created_at).toLocaleDateString('he-IL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleMarkAsRead(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            disabled={loading}
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="prose prose-lg max-w-none">
                        <div
                            className="text-gray-800 leading-relaxed text-lg"
                            dangerouslySetInnerHTML={{ __html: announcement.content }}
                        />
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={() => handleMarkAsRead(true)}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                        {loading ? 'שומר...' : 'קראתי - אל תציג שוב'}
                    </button>
                    <button
                        onClick={() => handleMarkAsRead(false)}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
                    >
                        {loading ? 'שומר...' : 'קראתי'}
                    </button>
                </div>
            </div>
        </div>
    )
}
