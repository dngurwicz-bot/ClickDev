'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Send, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import GlobalLoader from '@/components/ui/GlobalLoader'

interface Announcement {
    id: string
    title: string
    content: string
    type: string
    target_type: string
    target_organizations: string[] | null
    is_active: boolean
    created_at: string
}

interface Organization {
    id: string
    name: string
}

export default function AnnouncementsPage() {
    const router = useRouter()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info',
        target_type: 'all',
        target_organizations: [] as string[],
        is_active: true
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            await Promise.all([fetchAnnouncements(), fetchOrganizations()])
        } finally {
            setLoading(false)
        }
    }

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
        }
    }

    const fetchOrganizations = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name')
                .order('name')

            if (!error && data) {
                setOrganizations(data)
            }
        } catch (error) {
            console.error('Error fetching organizations:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const url = editingId
                ? `/api/announcements/${editingId}`
                : '/api/announcements'

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    ...formData,
                    target_organizations: formData.target_type === 'specific'
                        ? formData.target_organizations
                        : null
                })
            })

            if (response.ok) {
                toast.success(editingId ? 'ההודעה עודכנה בהצלחה' : 'ההודעה נוצרה בהצלחה')
                setShowForm(false)
                setEditingId(null)
                resetForm()
                fetchAnnouncements()
            } else {
                toast.error('שגיאה בשמירת ההודעה')
            }
        } catch (error) {
            console.error('Error saving announcement:', error)
            toast.error('שגיאה בשמירת ההודעה')
        }
    }

    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement.id)
        setFormData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            target_type: announcement.target_type,
            target_organizations: announcement.target_organizations || [],
            is_active: announcement.is_active
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק הודעה זו?')) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(`/api/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            })

            if (response.ok) {
                toast.success('ההודעה נמחקה בהצלחה')
                fetchAnnouncements()
            } else {
                toast.error('שגיאה במחיקת ההודעה')
            }
        } catch (error) {
            console.error('Error deleting announcement:', error)
            toast.error('שגיאה במחיקת ההודעה')
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            type: 'info',
            target_type: 'all',
            target_organizations: [],
            is_active: true
        })
    }

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            info: 'מידע',
            warning: 'אזהרה',
            success: 'הצלחה',
            update: 'עדכון'
        }
        return types[type] || type
    }

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            info: 'bg-blue-100 text-blue-800',
            warning: 'bg-yellow-100 text-yellow-800',
            success: 'bg-green-100 text-green-800',
            update: 'bg-purple-100 text-purple-800'
        }
        return colors[type] || colors.info
    }

    if (loading) {
        return <GlobalLoader />
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/admin/organizations')}
                    className="text-text-secondary hover:text-text-primary mb-4 flex items-center gap-2 transition-colors"
                >
                    <ArrowRight className="w-4 h-4" />
                    חזרה לניהול ארגונים
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">ניהול הודעות</h1>
                        <p className="text-text-secondary mt-1">יצירה ועריכה של הודעות לארגונים</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm()
                            setEditingId(null)
                            setShowForm(true)
                        }}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        הודעה חדשה
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-xl font-bold text-text-primary mb-4">
                        {editingId ? 'עריכת הודעה' : 'הודעה חדשה'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                כותרת <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                תוכן <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">סוג הודעה</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="info">מידע</option>
                                    <option value="warning">אזהרה</option>
                                    <option value="success">הצלחה</option>
                                    <option value="update">עדכון</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">יעד</label>
                                <select
                                    value={formData.target_type}
                                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="all">כל הארגונים</option>
                                    <option value="specific">ארגונים ספציפיים</option>
                                </select>
                            </div>
                        </div>

                        {formData.target_type === 'specific' && (
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    בחר ארגונים
                                </label>
                                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {organizations.map((org) => (
                                        <label key={org.id} className="flex items-center gap-2 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.target_organizations.includes(org.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            target_organizations: [...formData.target_organizations, org.id]
                                                        })
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            target_organizations: formData.target_organizations.filter(id => id !== org.id)
                                                        })
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{org.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-text-primary">
                                הודעה פעילה
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                {editingId ? 'עדכן' : 'פרסם'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingId(null)
                                    resetForm()
                                }}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Announcements List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-main">
                        <tr>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">כותרת</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">סוג</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">יעד</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">סטטוס</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">תאריך</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {announcements.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                    אין הודעות עדיין
                                </td>
                            </tr>
                        ) : (
                            announcements.map((announcement) => (
                                <tr key={announcement.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-text-primary">{announcement.title}</div>
                                        <div className="text-sm text-text-secondary truncate max-w-md">{announcement.content}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(announcement.type)}`}>
                                            {getTypeLabel(announcement.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {announcement.target_type === 'all' ? 'כל הארגונים' : `${announcement.target_organizations?.length || 0} ארגונים`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {announcement.is_active ? 'פעיל' : 'לא פעיל'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {new Date(announcement.created_at).toLocaleDateString('he-IL')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(announcement)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
