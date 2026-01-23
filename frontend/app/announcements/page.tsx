'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, Search, ArrowRight } from 'lucide-react'

interface Announcement {
    id: string
    title: string
    content: string
    type: string
    is_critical: boolean
    scheduled_for: string | null
    created_at: string
}

export default function AnnouncementsPage() {
    const router = useRouter()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch('/api/announcements', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAnnouncements(data)
            }
        } catch (error) {
            console.error('Error fetching announcements:', error)
        } finally {
            setLoading(false)
        }
    }

    const getAnnouncementIcon = (type: string) => {
        const icons: Record<string, any> = {
            info: Bell,
            warning: Bell,
            success: Bell,
            update: Bell
        }
        return icons[type] || Bell
    }

    const getAnnouncementColor = (type: string) => {
        const colors: Record<string, string> = {
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            success: 'bg-green-50 border-green-200 text-green-800',
            update: 'bg-purple-50 border-purple-200 text-purple-800'
        }
        return colors[type] || 'bg-blue-50 border-blue-200 text-blue-800'
    }

    const filteredAnnouncements = announcements.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-secondary">טוען הודעות...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-text-secondary hover:text-text-primary mb-4 flex items-center gap-2 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        חזרה
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Bell className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">כל ההודעות</h1>
                            <p className="text-text-secondary">{announcements.length} הודעות סה"כ</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="חיפוש הודעות..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                    {filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-text-secondary">
                                {searchTerm ? 'לא נמצאו תוצאות' : 'אין הודעות'}
                            </p>
                        </div>
                    ) : (
                        filteredAnnouncements.map((announcement) => {
                            const Icon = getAnnouncementIcon(announcement.type)
                            const colorClass = getAnnouncementColor(announcement.type)

                            return (
                                <div
                                    key={announcement.id}
                                    onClick={() => setSelectedAnnouncement(announcement)}
                                    className={`p-5 rounded-xl border-2 ${colorClass} cursor-pointer hover:shadow-md transition-all bg-white`}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">{announcement.title}</h3>
                                            <p className="text-sm opacity-90 line-clamp-3">{announcement.content}</p>
                                        </div>
                                        {announcement.is_critical && (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                                קריטי
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs opacity-60">
                                        {new Date(announcement.created_at).toLocaleDateString('he-IL', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedAnnouncement && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedAnnouncement(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold mb-2">{selectedAnnouncement.title}</h2>
                            <p className="text-sm text-gray-500">
                                {new Date(selectedAnnouncement.created_at).toLocaleDateString('he-IL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {selectedAnnouncement.content}
                            </p>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                            >
                                סגור
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
