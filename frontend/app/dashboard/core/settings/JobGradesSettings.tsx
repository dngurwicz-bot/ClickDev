'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Save, Loader2, Edit2, X } from 'lucide-react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'

interface JobGrade {
    id: string
    name: string
    level: number
}

export function JobGradesSettings() {
    const { currentOrg } = useOrganization()
    const [grades, setGrades] = useState<JobGrade[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<{ name: string; level: string }>({ name: '', level: '' })
    const [isAdding, setIsAdding] = useState(false)

    const fetchGrades = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('job_grades')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('level', { ascending: true })

            if (error) throw error
            setGrades(data || [])
        } catch (err) {
            console.error('Error fetching grades:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGrades()
    }, [currentOrg])

    const handleSave = async () => {
        if (!currentOrg) return
        if (!editForm.name || !editForm.level) return

        setSaving(true)
        try {
            const gradeData = {
                organization_id: currentOrg.id,
                name: editForm.name,
                level: parseInt(editForm.level),
            }

            if (editingId) {
                const { error } = await supabase
                    .from('job_grades')
                    .update(gradeData)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('job_grades')
                    .insert(gradeData)
                if (error) throw error
            }

            await fetchGrades()
            setEditingId(null)
            setIsAdding(false)
            setEditForm({ name: '', level: '' })
        } catch (err) {
            console.error('Error saving grade:', err)
            alert('שגיאה בשמירת הדירוג')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח?')) return
        try {
            const { error } = await supabase
                .from('job_grades')
                .delete()
                .eq('id', id)
            if (error) throw error
            fetchGrades()
        } catch (err) {
            console.error('Error deleting grade:', err)
            alert('שגיאה במחיקת הדירוג')
        }
    }

    const startEdit = (grade: JobGrade) => {
        setEditingId(grade.id)
        setEditForm({ name: grade.name, level: grade.level.toString() })
        setIsAdding(false)
    }

    const startAdd = () => {
        setEditingId(null)
        setEditForm({ name: '', level: '' })
        setIsAdding(true)
    }

    if (loading) return <div>טוען...</div>

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">דירוגי תפקיד</h2>
                {!isAdding && !editingId && (
                    <Button onClick={startAdd} size="sm" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        הוסף דירוג
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                    <div className="col-span-2">רמה (1-10)</div>
                    <div className="col-span-8">שם הדירוג</div>
                    <div className="col-span-2">פעולות</div>
                </div>

                {/* List */}
                {grades.map(grade => (
                    <div key={grade.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b last:border-0 hover:bg-gray-50 transition-colors">
                        {editingId === grade.id ? (
                            <>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={editForm.level}
                                        onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                                        className="h-8"
                                    />
                                </div>
                                <div className="col-span-8">
                                    <Input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="h-8"
                                        placeholder="שם הדירוג..."
                                    />
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
                                <div className="col-span-2 flex justify-center">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                        {grade.level}
                                    </span>
                                </div>
                                <div className="col-span-8 font-medium">{grade.name}</div>
                                <div className="col-span-2 flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => startEdit(grade)}>
                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(grade.id)}>
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
                        <div className="col-span-2">
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={editForm.level}
                                onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                                className="h-8 bg-white"
                                placeholder="1"
                            />
                        </div>
                        <div className="col-span-8">
                            <Input
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="h-8 bg-white"
                                placeholder="שם הדירוג החדש..."
                                autoFocus
                            />
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

                {!isAdding && grades.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        לא נמצאו דירוגים. הוסף דירוג חדש כדי להתחיל.
                    </div>
                )}
            </div>
        </Card>
    )
}
