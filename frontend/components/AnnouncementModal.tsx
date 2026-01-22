'use client'

import { X } from 'lucide-react'

interface AnnouncementModalProps {
    announcement: {
        title: string
        content: string
        type: string
        created_at: string
    } | null
    onClose: () => void
}

export default function AnnouncementModal({ announcement, onClose }: AnnouncementModalProps) {
    if (!announcement) return null

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
            case 'success': return 'bg-green-50 border-green-200 text-green-800'
            case 'update': return 'bg-purple-50 border-purple-200 text-purple-800'
            default: return 'bg-blue-50 border-blue-200 text-blue-800'
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 border-b-2 ${getTypeColor(announcement.type)}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{announcement.title}</h2>
                            <p className="text-sm opacity-70">
                                {new Date(announcement.created_at).toLocaleDateString('he-IL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {announcement.content}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    )
}
