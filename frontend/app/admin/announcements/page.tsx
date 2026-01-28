'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Send, ArrowRight, Bell, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import GlobalLoader from '@/components/ui/GlobalLoader'
import ExportModal from '@/components/ExportModal'
import RichTextEditor from '@/components/RichTextEditor'
import DataTable from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FacetedFilter } from '@/components/FacetedFilter'

interface Announcement {
    id: string
    title: string
    content: string
    type: string
    target_type: string
    target_organizations: string[] | null
    is_active: boolean
    is_critical: boolean
    scheduled_for: string | null
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
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterCritical, setFilterCritical] = useState<string>('all')
    const [showExportModal, setShowExportModal] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info',
        target_type: 'all',
        target_organizations: [] as string[],
        is_active: true,
        is_critical: false,
        schedule_later: false,
        scheduled_for: ''
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
                    title: formData.title,
                    content: formData.content,
                    type: formData.type,
                    target_type: formData.target_type,
                    target_organizations: formData.target_type === 'specific'
                        ? formData.target_organizations
                        : null,
                    is_active: formData.is_active,
                    is_critical: formData.is_critical,
                    scheduled_for: formData.schedule_later && formData.scheduled_for
                        ? new Date(formData.scheduled_for).toISOString()
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
            is_active: announcement.is_active,
            is_critical: announcement.is_critical || false,
            schedule_later: !!announcement.scheduled_for,
            scheduled_for: announcement.scheduled_for
                ? new Date(announcement.scheduled_for).toISOString().slice(0, 16)
                : ''
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
            is_active: true,
            is_critical: false,
            schedule_later: false,
            scheduled_for: ''
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

    const exportToExcel = (type: 'all' | 'filtered' | 'custom' = 'filtered', customCount?: number) => {
        try {
            const XLSX = require('xlsx')

            // Get data based on export type
            let dataToExport: Announcement[]

            if (type === 'all') {
                dataToExport = announcements
            } else if (type === 'filtered') {
                dataToExport = getFilteredAnnouncements()
            } else { // custom
                dataToExport = getFilteredAnnouncements().slice(0, customCount || 10)
            }

            // Prepare data for Excel
            const excelData = dataToExport.map(announcement => ({
                'כותרת': announcement.title,
                'תוכן': announcement.content.replace(/<[^>]*>/g, ''), // Remove HTML tags
                'סוג': getTypeLabel(announcement.type),
                'יעד': announcement.target_type === 'all' ? 'כל הארגונים' : `${announcement.target_organizations?.length || 0} ארגונים`,
                'סטטוס': announcement.is_active ? 'פעיל' : 'לא פעיל',
                'קריטי': announcement.is_critical ? 'כן' : 'לא',
                'מתוזמן': announcement.scheduled_for
                    ? new Date(announcement.scheduled_for).toLocaleString('he-IL')
                    : 'לא',
                'תאריך יצירה': new Date(announcement.created_at).toLocaleDateString('he-IL')
            }))

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(excelData)

            // Set column widths
            const colWidths = [
                { wch: 30 }, // כותרת
                { wch: 50 }, // תוכן
                { wch: 15 }, // סוג
                { wch: 20 }, // יעד
                { wch: 10 }, // סטטוס
                { wch: 10 }, // קריטי
                { wch: 20 }, // מתוזמן
                { wch: 15 }  // תאריך
            ]
            ws['!cols'] = colWidths

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'הודעות')

            // Generate Excel file
            const typeLabel = type === 'all' ? 'הכל' : type === 'filtered' ? 'מסונן' : 'מותאם'
            const fileName = `הודעות_${typeLabel}_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.xlsx`
            XLSX.writeFile(wb, fileName)

            toast.success(`${dataToExport.length} הודעות יוצאו בהצלחה!`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('שגיאה ביצוא הקובץ')
        }
    }

    const getFilteredAnnouncements = () => {
        return announcements.filter(announcement => {
            // Search filter
            const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                announcement.content.toLowerCase().includes(searchTerm.toLowerCase())

            // Status filter
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && announcement.is_active) ||
                (filterStatus === 'inactive' && !announcement.is_active) ||
                (filterStatus === 'scheduled' && announcement.scheduled_for && new Date(announcement.scheduled_for) > new Date())

            // Type filter
            const matchesType = filterType === 'all' || announcement.type === filterType

            // Critical filter
            const matchesCritical = filterCritical === 'all' ||
                (filterCritical === 'critical' && announcement.is_critical) ||
                (filterCritical === 'normal' && !announcement.is_critical)

            return matchesSearch && matchesStatus && matchesType && matchesCritical
        })
    }

    // Define columns for DataTable
    const columns: ColumnDef<Announcement>[] = [
        {
            accessorKey: 'title',
            header: 'כותרת',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-text-primary">{row.original.title}</div>
                    <div className="text-sm text-text-secondary truncate max-w-md">{row.original.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</div>
                </div>
            ),
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            accessorKey: 'type',
            header: 'סוג',
            cell: ({ row }) => {
                const colors: Record<string, string> = {
                    info: 'bg-blue-100 text-blue-800',
                    warning: 'bg-yellow-100 text-yellow-800',
                    success: 'bg-green-100 text-green-800',
                    update: 'bg-purple-100 text-purple-800'
                }
                const labels: Record<string, string> = {
                    info: 'מידע',
                    warning: 'אזהרה',
                    success: 'הצלחה',
                    update: 'עדכון'
                }
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[row.original.type]}`}>
                        {labels[row.original.type]}
                    </span>
                )
            },
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            accessorKey: 'target_type',
            header: 'יעד',
            cell: ({ row }) => (
                <span className="text-sm text-text-secondary">
                    {row.original.target_type === 'all' ? 'כל הארגונים' : `${row.original.target_organizations?.length || 0} ארגונים`}
                </span>
            ),
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            accessorKey: 'is_active',
            header: 'סטטוס',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${row.original.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {row.original.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                    {row.original.scheduled_for && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${new Date(row.original.scheduled_for) > new Date()
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {new Date(row.original.scheduled_for) > new Date()
                                ? `🕐 מתוזמן ל-${new Date(row.original.scheduled_for).toLocaleDateString('he-IL')}`
                                : '✓ פורסם'
                            }
                        </span>
                    )}
                    {row.original.is_critical && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                            ⚠️ קריטי
                        </span>
                    )}
                </div>
            ),
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            accessorKey: 'created_at',
            header: 'תאריך',
            cell: ({ row }) => (
                <div className="text-sm text-text-secondary">
                    <div>{new Date(row.original.created_at).toLocaleDateString('he-IL')}</div>
                    <div className="text-xs text-gray-500">
                        {new Date(row.original.created_at).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            ),
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            id: 'actions',
            header: 'פעולות',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(row.original)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(row.original.id)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
            enableSorting: false,
            enableColumnFilter: false,
        },
    ]

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
                    <div className="flex gap-3 items-center">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="חיפוש הודעות..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                            />
                            <Bell className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
                        >
                            <option value="all">כל הסטטוסים</option>
                            <option value="active">פעיל</option>
                            <option value="inactive">לא פעיל</option>
                            <option value="scheduled">מתוזמן</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
                        >
                            <option value="all">כל הסוגים</option>
                            <option value="info">מידע</option>
                            <option value="warning">אזהרה</option>
                            <option value="success">הצלחה</option>
                            <option value="update">עדכון</option>
                        </select>

                        {/* Critical Filter */}
                        <select
                            value={filterCritical}
                            onChange={(e) => setFilterCritical(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
                        >
                            <option value="all">הכל</option>
                            <option value="critical">קריטי בלבד</option>
                            <option value="normal">רגיל בלבד</option>
                        </select>

                        {/* Export Button */}
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            יצוא לאקסל
                        </button>

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
                            <RichTextEditor
                                content={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="הכנס את תוכן ההודעה..."
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

                        {/* Scheduling Section */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="schedule_later"
                                    checked={formData.schedule_later}
                                    onChange={(e) => setFormData({ ...formData, schedule_later: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="schedule_later" className="text-sm font-medium text-text-primary">
                                    תזמן לפרסום מאוחר יותר
                                </label>
                            </div>

                            {formData.schedule_later && (
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        תאריך ושעה לפרסום
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_for}
                                        onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required={formData.schedule_later}
                                    />
                                </div>
                            )}
                        </div>

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

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_critical"
                                checked={formData.is_critical}
                                onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="is_critical" className="text-sm font-medium text-text-primary flex items-center gap-2">
                                <span className="text-red-600">⚠️</span>
                                הודעה קריטית (תופיע כחלון קופץ למשתמש)
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
            <DataTable
                columns={columns}
                data={getFilteredAnnouncements()}
                showSearch={false}
            />

            {/* Export Modal */}
            {showExportModal && (
                <ExportModal
                    onClose={() => setShowExportModal(false)}
                    onExport={(type, customCount) => exportToExcel(type, customCount)}
                    totalCount={announcements.length}
                    filteredCount={getFilteredAnnouncements().length}
                    hasFilters={searchTerm !== '' || filterStatus !== 'all' || filterType !== 'all' || filterCritical !== 'all'}
                />
            )}
        </div>
    )
}
