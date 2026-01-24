'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Save, Loader2, Edit2, X } from 'lucide-react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'

interface JobTitle {
    id: string
    title: string
    default_grade_id: string | null
    grade?: {
        name: string
        level: number
    }
}

interface JobGrade {
    id: string
    name: string
    level: number
}

export function JobTitlesSettings() {
    const { currentOrg } = useOrganization()
    const [titles, setTitles] = useState<JobTitle[]>([])
    const [grades, setGrades] = useState<JobGrade[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<{ title: string; default_grade_id: string }>({ title: '', default_grade_id: '' })
    const [isAdding, setIsAdding] = useState(false)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            // Fetch Titles with Grades
            const { data: titlesData, error: titlesError } = await supabase
                .from('job_titles')
                .select('*, grade:job_grades(name, level)')
                .eq('organization_id', currentOrg.id)
                .order('title', { ascending: true })

            if (titlesError) throw titlesError
            setTitles(titlesData || [])

            // Fetch Grades for Dropdown
            const { data: gradesData, error: gradesError } = await supabase
                .from('job_grades')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('level', { ascending: true })

            if (gradesError) throw gradesError
            setGrades(gradesData || [])

        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentOrg])

    const handleSave = async () => {
        if (!currentOrg) return
        if (!editForm.title) return

        setSaving(true)
        try {
            const titleData = {
                organization_id: currentOrg.id,
                title: editForm.title,
                default_grade_id: editForm.default_grade_id || null,
            }

            if (editingId) {
                const { error } = await supabase
                    .from('job_titles')
                    .update(titleData)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('job_titles')
                    .insert(titleData)
                if (error) throw error
            }

            await fetchData()
            setEditingId(null)
            setIsAdding(false)
            setEditForm({ title: '', default_grade_id: '' })
        } catch (err) {
            console.error('Error saving title:', err)
            alert('שגיאה בשמירת התפקיד')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח?')) return
        try {
            const { error } = await supabase
                .from('job_titles')
                .delete()
                .eq('id', id)
            if (error) throw error
            fetchData()
        } catch (err) {
            console.error('Error deleting title:', err)
            alert('שגיאה במחיקת התפקיד')
        }
    }

    const startEdit = (title: JobTitle) => {
        setEditingId(title.id)
        setEditForm({ title: title.title, default_grade_id: title.default_grade_id || '' })
        setIsAdding(false)
    }

    const startAdd = () => {
        setEditingId(null)
        setEditForm({ title: '', default_grade_id: '' })
        setIsAdding(true)
    }

    if (loading) return <div>טוען...</div>

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">הגדרת תפקידים</h2>
                {!isAdding && !editingId && (
                    <Button onClick={startAdd} size="sm" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        הוסף תפקיד
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                    <div className="col-span-6">שם תפקיד</div>
                    <div className="col-span-4">דירוג ברירת מחדל</div>
                    <div className="col-span-2">פעולות</div>
                </div>

                {/* List */}
                {titles.map(title => (
                    <div key={title.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b last:border-0 hover:bg-gray-50 transition-colors">
                        {editingId === title.id ? (
                            <>
                                <div className="col-span-6">
                                    <Input
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="h-8"
                                        placeholder="שם התפקיד..."
                                    />
                                </div>
                                <div className="col-span-4">
                                    <select
                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.default_grade_id}
                                        onChange={e => setEditForm({ ...editForm, default_grade_id: e.target.value })}
                                    >
                                        <option value="">בחר דירוג...</option>
                                        {grades.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 flex gap-2">
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="col-span-6 font-medium">{title.title}</div>
                                <div className="col-span-4 text-sm text-gray-600">
                                    {title.grade ? (
                                        <span className="bg-gray-100 px-2 py-1 rounded-md">
                                            {title.grade.name} ({title.grade.level})
                                        </span>
                                    ) : '-'}
                                </div>
                                <div className="col-span-2 flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => startEdit(title)}>
                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(title.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {/* Add Form */}
                {isAdding && (
                    <div className="grid grid-cols-12 gap-4 items-center py-2 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                        <div className="col-span-6">
                            <Input
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                className="h-8 bg-white"
                                placeholder="שם התפקיד החדש..."
                                autoFocus
                            />
                        </div>
                        <div className="col-span-4">
                            <select
                                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editForm.default_grade_id}
                                onChange={e => setEditForm({ ...editForm, default_grade_id: e.target.value })}
                            >
                                <option value="">בחר דירוג...</option>
                                {grades.map(g => (
                                    <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 flex gap-2">
                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {!isAdding && titles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        לא נמצאו תפקידים. הוסף תפקיד חדש כדי להתחיל.
                    </div>
                )}
            </div>
        </Card>
    )
}
